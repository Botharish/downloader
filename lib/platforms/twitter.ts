import { createPlatform } from "./base";

/**
 * Twitter / X — videos, GIFs (served as mp4), images, metadata.
 * Covers both the legacy twitter.com and current x.com hosts.
 */
export const twitter = createPlatform({
  id: "twitter",
  name: "Twitter / X",
  patterns: [
    /^(https?:\/\/)?(www\.|mobile\.)?twitter\.com\//i,
    /^(https?:\/\/)?(www\.|mobile\.)?x\.com\//i,
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
