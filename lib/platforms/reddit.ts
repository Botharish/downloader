import { createPlatform } from "./base";

/**
 * Reddit — videos (DASH, muxed with audio by yt-dlp), GIFs, images.
 * Covers old.reddit, www.reddit, and redd.it short links.
 */
export const reddit = createPlatform({
  id: "reddit",
  name: "Reddit",
  patterns: [
    /^(https?:\/\/)?(www\.|old\.|new\.|m\.)?reddit\.com\//i,
    /^(https?:\/\/)?(v\.)?redd\.it\//i,
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
