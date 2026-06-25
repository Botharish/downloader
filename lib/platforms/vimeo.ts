import { createPlatform } from "./base";

/**
 * Vimeo — videos, metadata, thumbnails. Password-protected videos require
 * yt-dlp's --video-password (not exposed in this UI).
 */
export const vimeo = createPlatform({
  id: "vimeo",
  name: "Vimeo",
  patterns: [
    /^(https?:\/\/)?(www\.)?vimeo\.com\//i,
    /^(https?:\/\/)?player\.vimeo\.com\//i,
  ],
  capabilities: {
    video: true,
    audio: true,
    image: false,
    subtitle: true,
    thumbnail: true,
    playlist: false,
  },
});
