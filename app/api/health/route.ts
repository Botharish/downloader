import { NextResponse } from "next/server";
import { probeBinaries } from "@/lib/ytdlp";
import { supportedPlatforms } from "@/lib/platforms/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/health — reports binary availability + registered platforms. */
export async function GET() {
  const bins = await probeBinaries();
  const ok = Boolean(bins.ytdlp && bins.ffmpeg);
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      ytdlp: bins.ytdlp,
      ffmpeg: bins.ffmpeg,
      platforms: supportedPlatforms.map((p) => p.id),
      time: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
