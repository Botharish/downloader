import { createPlatform } from "./base";

/**
 * TikTok — videos, photo slideshows, music, thumbnails.
 * Videos are typically offered watermark-free by yt-dlp's extractor.
 */
export const tiktok = createPlatform({
  id: "tiktok",
  name: "TikTok",
  patterns: [
    /^(https?:\/\/)?(www\.)?tiktok\.com\//i,
    /^(https?:\/\/)?(vm|vt)\.tiktok\.com\//i,
  ],
  capabilities: {
    video: true,
    audio: true,
    image: true,
    subtitle: false,
    thumbnail: true,
    playlist: false,
  },
});
