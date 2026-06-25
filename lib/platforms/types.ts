/**
 * Common contract every platform plugin implements.
 *
 * The heavy lifting (network, extraction, muxing) is delegated to the shared
 * yt-dlp engine in `lib/ytdlp.ts`; a plugin is mostly *declarative*: which URLs
 * it owns, what it can produce, and any platform-specific yt-dlp arguments.
 *
 * This keeps the modular promise of the spec — if a platform changes, you touch
 * one file — without duplicating extraction logic eight times.
 */

export type PlatformId =
  | "youtube"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "twitter"
  | "pinterest"
  | "reddit"
  | "vimeo";

export interface PlatformCapabilities {
  video: boolean;
  audio: boolean;
  image: boolean;
  subtitle: boolean;
  thumbnail: boolean;
  playlist: boolean;
}

/** A single downloadable rendition surfaced to the UI. */
export interface MediaFormat {
  /** yt-dlp format_id, or a synthetic id for derived options (audio/thumbnail). */
  id: string;
  /** "video" | "audio" | "image" — drives the UI grouping. */
  kind: "video" | "audio" | "image";
  /** Human label, e.g. "1080p", "MP3 128k", "Thumbnail". */
  label: string;
  ext: string;
  height?: number;
  fps?: number;
  /** Estimated size in bytes when yt-dlp can provide it. */
  filesize?: number;
  /** True when this rendition needs a separate audio track muxed in. */
  needsMux?: boolean;
}

export interface MediaMetadata {
  id: string;
  platform: PlatformId;
  title: string;
  thumbnail: string | null;
  /** Duration in seconds, null for images/galleries. */
  duration: number | null;
  uploader: string | null;
  views: number | null;
  isPlaylist: boolean;
  entries?: number;
  formats: MediaFormat[];
  /** Original URL, echoed back for the download step. */
  webpageUrl: string;
}

export interface PluginConfig {
  id: PlatformId;
  name: string;
  /** Patterns that claim a URL for this platform. */
  patterns: RegExp[];
  capabilities: PlatformCapabilities;
  /** Extra args appended to every yt-dlp invocation for this platform. */
  extraArgs?: string[];
  /**
   * Preferred container when muxing video+audio. Defaults to "mp4".
   * Some platforms (e.g. images-only Pinterest pins) override behavior upstream.
   */
  mergeFormat?: string;
}

export interface PlatformPlugin {
  readonly id: PlatformId;
  readonly name: string;
  readonly capabilities: PlatformCapabilities;
  readonly config: PluginConfig;
  matches(url: string): boolean;
  getMetadata(url: string): Promise<MediaMetadata>;
  getFormats(url: string): Promise<MediaFormat[]>;
  /** Resolves the yt-dlp format selector + output options for a chosen format id. */
  resolveSelection(formatId: string): DownloadSelection;
}

/** What the download route needs to actually fetch a chosen rendition. */
export interface DownloadSelection {
  /** yt-dlp `-f` selector. */
  formatSelector: string;
  /** "video" | "audio" | "thumbnail". */
  mode: "video" | "audio" | "thumbnail";
  /** Output container for muxed video. */
  mergeFormat: string;
  /** Audio codec for audio-only extraction. */
  audioFormat?: string;
}
