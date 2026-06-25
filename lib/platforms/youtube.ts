import { createPlatform } from "./base";

/**
 * YouTube — videos, Shorts, playlists, audio, subtitles, thumbnails.
 * yt-dlp handles signature extraction and adaptive formats natively.
 */
export const youtube = createPlatform({
  id: "youtube",
  name: "YouTube",
  patterns: [
    /^(https?:\/\/)?(www\.)?youtube\.com\/(watch|shorts|playlist|embed|live)/i,
    /^(https?:\/\/)?(m\.)?youtube\.com\//i,
    /^(https?:\/\/)?youtu\.be\//i,
  ],
  capabilities: {
    video: true,
    audio: true,
    image: false,
    subtitle: true,
    thumbnail: true,
    playlist: true,
  },
});
