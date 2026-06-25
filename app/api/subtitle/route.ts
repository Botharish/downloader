import { NextResponse } from "next/server";
import { z } from "zod";
import { urlSchema, normalizeUrl } from "@/lib/validator";
import { pluginForUrl } from "@/lib/platforms/registry";
import { createTempDir, findProducedFile } from "@/lib/temp";
import { removeDir } from "@/lib/cleanup";
import { fileToResponse } from "@/lib/stream";
import { spawn } from "node:child_process";
import { ffmpegLocationArgs, resolveYtdlpPath } from "@/lib/binaries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const YTDLP = resolveYtdlpPath();
// Only point yt-dlp at an explicit ffmpeg path; a bare name breaks discovery.
const FFMPEG_LOCATION_ARGS = ffmpegLocationArgs();

const subtitleSchema = z.object({
  url: urlSchema,
  /** BCP-47 language code, defaults to English. */
  lang: z
    .string()
    .trim()
    .regex(/^[a-z]{2}(-[A-Za-z]{2,4})?$/, "Invalid language code")
    .optional(),
});

/** POST /api/subtitle — { url, lang? } → streams an .srt file. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = subtitleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid request" },
      { status: 400 },
    );
  }

  const url = normalizeUrl(parsed.data.url);
  const plugin = pluginForUrl(url);
  if (!plugin) {
    return NextResponse.json({ error: "Unsupported URL" }, { status: 422 });
  }
  if (!plugin.capabilities.subtitle) {
    return NextResponse.json(
      { error: `${plugin.name} does not provide subtitles` },
      { status: 422 },
    );
  }

  const lang = parsed.data.lang || "en";
  const tempDir = await createTempDir();
  try {
    await runYtdlp([
      "--no-warnings",
      "--no-progress",
      ...FFMPEG_LOCATION_ARGS,
      "--skip-download",
      "--write-subs",
      "--write-auto-subs",
      "--sub-langs",
      `${lang}.*`,
      "--convert-subs",
      "srt",
      "--restrict-filenames",
      "-o",
      `${tempDir}/sub.%(ext)s`,
      ...(plugin.config.extraArgs ?? []),
      url,
    ]);

    const file = await findProducedFile(tempDir);
    if (!file) {
      await removeDir(tempDir);
      return NextResponse.json(
        { error: "No subtitles found for this language" },
        { status: 404 },
      );
    }
    return await fileToResponse(file, {
      downloadName: `${plugin.name}-${lang}.srt`,
      contentType: "application/x-subrip",
      onClose: () => removeDir(tempDir),
    });
  } catch (err) {
    await removeDir(tempDir);
    const message = err instanceof Error ? err.message : "Subtitle fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function runYtdlp(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(YTDLP, args, { windowsHide: true });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error("Subtitle download failed")),
    );
  });
}
