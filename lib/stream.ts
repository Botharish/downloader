import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename } from "node:path";
import { Readable } from "node:stream";

/**
 * Stream a file from disk to the browser as a Web Response, then run a cleanup
 * callback once the stream is fully consumed (or aborted). This is how we honor
 * the spec's "stream to browser → delete temporary file" pipeline.
 */
export async function fileToResponse(
  filePath: string,
  opts: {
    downloadName?: string;
    contentType?: string;
    onClose?: () => void | Promise<void>;
  } = {},
): Promise<Response> {
  const info = await stat(/*turbopackIgnore: true*/ filePath);
  const name = opts.downloadName || basename(filePath);

  const nodeStream = createReadStream(/*turbopackIgnore: true*/ filePath);
  let settled = false;
  const finalize = () => {
    if (settled) return;
    settled = true;
    void opts.onClose?.();
  };
  nodeStream.on("close", finalize);
  nodeStream.on("error", finalize);

  // Node Readable → Web ReadableStream for the Response body.
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": opts.contentType || guessContentType(name),
      "Content-Length": String(info.size),
      "Content-Disposition": `attachment; filename="${sanitizeFilename(name)}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Strip characters that break the Content-Disposition header. */
export function sanitizeFilename(name: string): string {
  return name.replace(/["\\/\r\n]/g, "_").slice(0, 200) || "download";
}

function guessContentType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mkv":
      return "video/x-matroska";
    case "mp3":
      return "audio/mpeg";
    case "m4a":
      return "audio/mp4";
    case "opus":
      return "audio/opus";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}
