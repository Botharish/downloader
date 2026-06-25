import { NextResponse } from "next/server";
import { metadataRequestSchema, normalizeUrl } from "@/lib/validator";
import { pluginForUrl } from "@/lib/platforms/registry";
import { downloadToFile, YtdlpError } from "@/lib/ytdlp";
import { createTempDir, findProducedFile } from "@/lib/temp";
import { removeDir } from "@/lib/cleanup";
import { fileToResponse } from "@/lib/stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/thumbnail — { url } → streams the highest-res thumbnail as JPG. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = metadataRequestSchema.safeParse(body);
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

  const tempDir = await createTempDir();
  try {
    await downloadToFile({
      url,
      outDir: tempDir,
      basename: "thumb",
      mode: "thumbnail",
      formatSelector: "",
      mergeFormat: "mp4",
      extraArgs: plugin.config.extraArgs,
    });
    const file = await findProducedFile(tempDir);
    if (!file) {
      await removeDir(tempDir);
      return NextResponse.json({ error: "No thumbnail available" }, { status: 404 });
    }
    return await fileToResponse(file, {
      downloadName: `${plugin.name}-thumbnail.jpg`,
      onClose: () => removeDir(tempDir),
    });
  } catch (err) {
    await removeDir(tempDir);
    const message = err instanceof YtdlpError ? err.message : "Thumbnail failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
