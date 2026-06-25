import { spawn } from "node:child_process";
import type { MediaFormat, MediaMetadata, PlatformId } from "./platforms/types";
import { ffmpegLocationArgs, resolveFfmpegPath, resolveYtdlpPath } from "./binaries";

/**
 * Thin, typed wrapper around the yt-dlp binary.
 *
 * Everything here is process-level: build args, spawn, parse JSON. Higher layers
 * (the platform plugins) decide *what* to ask for; this decides *how* to ask.
 */

const YTDLP = resolveYtdlpPath();
const FFMPEG = resolveFfmpegPath();
const DEFAULT_TIMEOUT_MS =
  (Number(process.env.DOWNLOAD_TIMEOUT_SECONDS) || 600) * 1000;

/**
 * yt-dlp's `--ffmpeg-location` wants a real path/dir, NOT a bare command name.
 * Passing "ffmpeg" makes yt-dlp fail to find it and silently skip muxing. So we
 * only pass the flag when an explicit FFMPEG_PATH is set; otherwise we let
 * yt-dlp discover ffmpeg on PATH itself (which it does correctly).
 */
const FFMPEG_LOCATION_ARGS = ffmpegLocationArgs();

export class YtdlpError extends Error {
  constructor(
    message: string,
    public readonly code: number | null,
    public readonly stderr: string,
  ) {
    super(message);
    this.name = "YtdlpError";
  }
}

/** Common args we always want: no progress noise, no playlist unless asked. */
function baseArgs(extra: string[] = []): string[] {
  return ["--no-warnings", "--no-progress", ...FFMPEG_LOCATION_ARGS, ...extra];
}

interface RunOptions {
  /** Capture stdout as a string (for JSON dumps). */
  capture?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/** Spawn yt-dlp, collecting stdout/stderr. Rejects on non-zero exit. */
function run(args: string[], opts: RunOptions = {}): Promise<string> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  return new Promise((resolve, reject) => {
    const child = spawn(YTDLP, args, {
      windowsHide: true,
      signal: opts.signal,
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new YtdlpError("yt-dlp timed out", null, stderr));
    }, timeoutMs);

    child.stdout.on("data", (d) => {
      if (opts.capture) stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new YtdlpError(`Failed to spawn yt-dlp: ${err.message}`, null, stderr));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new YtdlpError(parseError(stderr), code, stderr));
    });
  });
}

/** Turn yt-dlp's noisy stderr into a user-friendly message. */
function parseError(stderr: string): string {
  const line = stderr
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .find((l) => l.startsWith("ERROR:"));
  if (!line) return "Unable to fetch media";
  const msg = line.replace(/^ERROR:\s*/, "");
  if (/private|login required|not available|sign in/i.test(msg))
    return "This content is private or requires sign-in";
  if (/unavailable|removed|deleted/i.test(msg))
    return "Media unavailable";
  if (/unsupported url/i.test(msg)) return "Unsupported URL";
  if (/geo|country/i.test(msg)) return "Not available in this region";
  return msg.slice(0, 240);
}

/** Raw yt-dlp `-J` info dump (subset we care about). */
interface RawFormat {
  format_id: string;
  ext: string;
  vcodec?: string;
  acodec?: string;
  height?: number | null;
  fps?: number | null;
  filesize?: number | null;
  filesize_approx?: number | null;
  format_note?: string;
}

interface RawInfo {
  id: string;
  title?: string;
  thumbnail?: string;
  duration?: number | null;
  uploader?: string;
  channel?: string;
  uploader_id?: string;
  view_count?: number | null;
  webpage_url?: string;
  _type?: string;
  entries?: unknown[];
  formats?: RawFormat[];
}

/** Fetch and normalize metadata + formats for a URL. */
export async function fetchInfo(
  url: string,
  platform: PlatformId,
  extraArgs: string[] = [],
  signal?: AbortSignal,
): Promise<MediaMetadata> {
  const out = await run(
    baseArgs([...extraArgs, "--flat-playlist", "-J", url]),
    { capture: true, signal },
  );
  const info = JSON.parse(out) as RawInfo;
  const isPlaylist = info._type === "playlist" || Array.isArray(info.entries);

  return {
    id: info.id,
    platform,
    title: info.title?.trim() || "Untitled",
    thumbnail: info.thumbnail ?? null,
    duration: typeof info.duration === "number" ? info.duration : null,
    uploader: info.uploader || info.channel || info.uploader_id || null,
    views: typeof info.view_count === "number" ? info.view_count : null,
    isPlaylist,
    entries: isPlaylist ? info.entries?.length : undefined,
    formats: isPlaylist ? [] : normalizeFormats(info.formats ?? [], info),
    webpageUrl: info.webpage_url || url,
  };
}

/**
 * Collapse yt-dlp's raw format list into the small set of choices a user cares
 * about: a handful of video heights, a best-audio option, and a thumbnail.
 */
function normalizeFormats(raw: RawFormat[], info: RawInfo): MediaFormat[] {
  const out: MediaFormat[] = [];

  // --- Video heights (dedup to the best variant per height) ---
  const byHeight = new Map<number, RawFormat>();
  for (const f of raw) {
    const hasVideo = f.vcodec && f.vcodec !== "none";
    if (!hasVideo || !f.height) continue;
    const existing = byHeight.get(f.height);
    const score = (f.filesize || f.filesize_approx || 0) + (f.fps || 0);
    const existingScore = existing
      ? (existing.filesize || existing.filesize_approx || 0) + (existing.fps || 0)
      : -1;
    if (score >= existingScore) byHeight.set(f.height, f);
  }

  const wantedHeights = [2160, 1440, 1080, 720, 480, 360, 240];
  for (const h of wantedHeights) {
    // Pick the available height closest at or below the target tier.
    const match = byHeight.get(h);
    if (!match) continue;
    const muxed = match.acodec && match.acodec !== "none";
    out.push({
      id: `h:${h}`,
      kind: "video",
      label: `${h}p`,
      ext: "mp4",
      height: h,
      fps: match.fps ?? undefined,
      filesize: match.filesize ?? match.filesize_approx ?? undefined,
      needsMux: !muxed,
    });
  }

  // Fallback: if no heights parsed but it's clearly a video, offer "best".
  if (out.length === 0 && (info.duration ?? 0) > 0) {
    out.push({ id: "h:best", kind: "video", label: "Best quality", ext: "mp4" });
  }

  // --- Audio-only ---
  const hasAudio = raw.some((f) => f.acodec && f.acodec !== "none");
  if (hasAudio || (info.duration ?? 0) > 0) {
    out.push({ id: "audio:mp3", kind: "audio", label: "MP3 (audio)", ext: "mp3" });
  }

  // --- Images (no video track at all → likely a photo/gallery post) ---
  const imageOnly =
    out.length === 0 || raw.every((f) => !f.vcodec || f.vcodec === "none");
  if (imageOnly && info.thumbnail) {
    out.push({ id: "image:best", kind: "image", label: "Image", ext: "jpg" });
  }

  // --- Thumbnail is always available when present ---
  if (info.thumbnail) {
    out.push({ id: "thumb", kind: "image", label: "Thumbnail", ext: "jpg" });
  }

  return out;
}

/**
 * Build the yt-dlp `-f` selector for a video height tier. Picks bestvideo at or
 * below the tier and merges best audio, falling back to a progressive stream.
 */
export function videoSelector(formatId: string): string {
  if (formatId === "h:best") return "bestvideo*+bestaudio/best";
  const h = Number(formatId.split(":")[1]);
  if (!h) return "bestvideo*+bestaudio/best";
  return `bestvideo[height<=${h}]+bestaudio/best[height<=${h}]/best`;
}

export interface DownloadToFileOptions {
  url: string;
  outDir: string;
  /** Output filename without extension; yt-dlp appends the real ext. */
  basename: string;
  mode: "video" | "audio" | "thumbnail";
  formatSelector: string;
  mergeFormat: string;
  audioFormat?: string;
  extraArgs?: string[];
  signal?: AbortSignal;
}

/**
 * Download a single chosen rendition to `outDir`. Returns the absolute path of
 * the produced file. The caller is responsible for streaming + cleanup.
 */
export async function downloadToFile(
  opts: DownloadToFileOptions,
): Promise<void> {
  const template = `${opts.outDir}/${opts.basename}.%(ext)s`;
  const common = baseArgs([
    ...(opts.extraArgs ?? []),
    "--no-playlist",
    "--restrict-filenames",
    "-o",
    template,
  ]);

  let args: string[];
  if (opts.mode === "audio") {
    args = [
      ...common,
      "-x",
      "--audio-format",
      opts.audioFormat || "mp3",
      "--audio-quality",
      "0",
      opts.url,
    ];
  } else if (opts.mode === "thumbnail") {
    args = [
      ...common,
      "--skip-download",
      "--write-thumbnail",
      "--convert-thumbnails",
      "jpg",
      opts.url,
    ];
  } else {
    args = [
      ...common,
      "-f",
      opts.formatSelector,
      "--merge-output-format",
      opts.mergeFormat,
      opts.url,
    ];
  }

  await run(args, { signal: opts.signal });
}

/** Confirm the binaries are reachable (used by /api/health). */
export async function probeBinaries(): Promise<{
  ytdlp: string | null;
  ffmpeg: string | null;
}> {
  const ytdlp = await run(["--version"], { capture: true })
    .then((v) => v.trim())
    .catch(() => null);

  const ffmpeg = await new Promise<string | null>((resolve) => {
    const child = spawn(FFMPEG, ["-version"], { windowsHide: true });
    let out = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.on("error", () => resolve(null));
    child.on("close", (code) =>
      resolve(code === 0 ? out.split("\n")[0]?.trim() || "ok" : null),
    );
  });

  return { ytdlp, ffmpeg };
}
