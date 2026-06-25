import { NextResponse } from "next/server";
import { metadataRequestSchema, normalizeUrl } from "@/lib/validator";
import { detectPlatform } from "@/lib/detectPlatform";
import { pluginForUrl } from "@/lib/platforms/registry";
import { YtdlpError } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/metadata — { url } → normalized metadata + available formats. */
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
  const detected = detectPlatform(url);
  if (!detected) {
    return NextResponse.json(
      { error: "Unsupported URL", code: "UNSUPPORTED" },
      { status: 422 },
    );
  }

  const plugin = pluginForUrl(url)!;
  try {
    const metadata = await plugin.getMetadata(url);
    return NextResponse.json({ metadata });
  } catch (err) {
    const message =
      err instanceof YtdlpError ? err.message : "Unable to fetch metadata";
    return NextResponse.json({ error: message, code: "FETCH_FAILED" }, { status: 502 });
  }
}
