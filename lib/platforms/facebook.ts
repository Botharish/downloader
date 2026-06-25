import { createPlatform } from "./base";

/**
 * Facebook — videos, Reels, watch clips, thumbnails.
 * Some videos require authentication (cookies) when not publicly shared.
 */
export const facebook = createPlatform({
  id: "facebook",
  name: "Facebook",
  patterns: [
    /^(https?:\/\/)?(www\.|web\.|m\.)?facebook\.com\//i,
    /^(https?:\/\/)?fb\.watch\//i,
    /^(https?:\/\/)?fb\.com\//i,
  ],
  capabilities: {
    video: true,
    audio: true,
    image: false,
    subtitle: false,
    thumbnail: true,
    playlist: false,
  },
});
