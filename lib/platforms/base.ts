import { fetchInfo, videoSelector } from "../ytdlp";
import type {
  DownloadSelection,
  MediaFormat,
  PlatformPlugin,
  PluginConfig,
} from "./types";

/**
 * Build a concrete plugin from a declarative config. All extraction is delegated
 * to the shared yt-dlp engine, so each platform file stays a few lines of
 * configuration — the modular seam the spec calls for.
 */
export function createPlatform(config: PluginConfig): PlatformPlugin {
  const mergeFormat = config.mergeFormat || "mp4";

  return {
    id: config.id,
    name: config.name,
    capabilities: config.capabilities,
    config,

    matches(url: string): boolean {
      return config.patterns.some((p) => p.test(url));
    },

    async getMetadata(url: string) {
      return fetchInfo(url, config.id, config.extraArgs ?? []);
    },

    async getFormats(url: string): Promise<MediaFormat[]> {
      const info = await fetchInfo(url, config.id, config.extraArgs ?? []);
      return info.formats;
    },

    resolveSelection(formatId: string): DownloadSelection {
      if (formatId === "thumb") {
        return { formatSelector: "", mode: "thumbnail", mergeFormat };
      }
      if (formatId.startsWith("audio:")) {
        const audioFormat = formatId.split(":")[1] || "mp3";
        return { formatSelector: "bestaudio/best", mode: "audio", mergeFormat, audioFormat };
      }
      if (formatId.startsWith("image:")) {
        // Single image post: grab the best still via thumbnail path.
        return { formatSelector: "", mode: "thumbnail", mergeFormat };
      }
      // Video height tiers (h:1080, h:best, ...)
      return { formatSelector: videoSelector(formatId), mode: "video", mergeFormat };
    },
  };
}
