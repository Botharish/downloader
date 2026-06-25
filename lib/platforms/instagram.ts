import { createPlatform } from "./base";

/**
 * Instagram — Reels, posts, videos, images, carousels, profile pictures.
 * Stories/highlights require the user to be authenticated; supply a cookies file
 * via yt-dlp's --cookies for authorized private content (not bundled here).
 */
export const instagram = createPlatform({
  id: "instagram",
  name: "Instagram",
  patterns: [
    /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|reels|tv|stories)\//i,
    /^(https?:\/\/)?(www\.)?instagr\.am\//i,
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
