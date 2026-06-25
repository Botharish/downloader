import { createPlatform } from "./base";

/**
 * Pinterest — pins (image or video), thumbnails.
 * Many pins are stills; the engine surfaces an "Image" option in that case.
 */
export const pinterest = createPlatform({
  id: "pinterest",
  name: "Pinterest",
  patterns: [
    /^(https?:\/\/)?(www\.)?pinterest\.[a-z.]+\//i,
    /^(https?:\/\/)?pin\.it\//i,
  ],
  capabilities: {
    video: true,
    audio: false,
    image: true,
    subtitle: false,
    thumbnail: true,
    playlist: false,
  },
});
