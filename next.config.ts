import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow remote thumbnails from any platform CDN to be rendered via next/image.
  // We constrain protocols only; hostnames vary widely across platforms.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  // yt-dlp / ffmpeg are spawned as child processes from route handlers.
  // Keep them out of the bundle trace.
  serverExternalPackages: [],
};

export default nextConfig;
