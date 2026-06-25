import { NextResponse } from "next/server";
import { downloadRequestSchema, normalizeUrl } from "@/lib/validator";
import { pluginForUrl } from "@/lib/platforms/registry";
import { downloadToFile, YtdlpError } from "@/lib/ytdlp";
import { createTempDir, findProducedFile } from "@/lib/temp";
import { removeDir, sweepStaleTemp } from "@/lib/cleanup";
import { fileToResponse, sanitizeFilename } from "@/lib/stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/download — { url, formatId, title? }
 *
 * Pipeline: validate → detect → resolve selection → download to a per-request
 * temp dir → stream the file to the browser → delete the temp dir on close.
 */
export async function POST(req: Request) {
  // Opportunistic sweep of anything a prior crashed request left behind.
  void sweepStaleTemp();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = downloadRequestSchema.safeParse(body);
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

  const selection = plugin.resolveSelection(parsed.data.formatId);
  const tempDir = await createTempDir();
  const abort = new AbortController();
  // If the client disconnects, kill the yt-dlp process.
  req.signal.addEventListener("abort", () => abort.abort());

  try {
    await downloadToFile({
      url,
      outDir: tempDir,
      basename: "media",
      mode: selection.mode,
      formatSelector: selection.formatSelector,
      mergeFormat: selection.mergeFormat,
      audioFormat: selection.audioFormat,
      extraArgs: plugin.config.extraArgs,
      signal: abort.signal,
    });

    const file = await findProducedFile(tempDir);
    if (!file) {
      await removeDir(tempDir);
      return NextResponse.json(
        { error: "Download produced no file" },
        { status: 502 },
      );
    }

    const ext = file.split(".").pop() || "bin";
    const base = parsed.data.title?.trim() || plugin.name + "-media";
    const downloadName = sanitizeFilename(`${base}.${ext}`);

    // Stream the file; delete the temp dir once the response body is drained.
    return await fileToResponse(file, {
      downloadName,
      onClose: () => removeDir(tempDir),
    });
  } catch (err) {
    await removeDir(tempDir);
    const message =
      err instanceof YtdlpError ? err.message : "Download failed";
    const status = err instanceof YtdlpError && err.code === null ? 504 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
