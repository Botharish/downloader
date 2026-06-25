import type { PlatformId, PlatformPlugin } from "./types";
import { youtube } from "./youtube";
import { instagram } from "./instagram";
import { tiktok } from "./tiktok";
import { facebook } from "./facebook";
import { twitter } from "./twitter";
import { pinterest } from "./pinterest";
import { reddit } from "./reddit";
import { vimeo } from "./vimeo";

/**
 * The single place every platform is registered. Adding a new platform is one
 * import + one array entry — nothing else in the app needs to change.
 */
export const plugins: PlatformPlugin[] = [
  youtube,
  instagram,
  tiktok,
  facebook,
  twitter,
  pinterest,
  reddit,
  vimeo,
];

const byId = new Map<PlatformId, PlatformPlugin>(
  plugins.map((p) => [p.id, p]),
);

/** Find the plugin that owns a URL, or null if none claim it. */
export function pluginForUrl(url: string): PlatformPlugin | null {
  return plugins.find((p) => p.matches(url)) ?? null;
}

export function pluginById(id: PlatformId): PlatformPlugin | null {
  return byId.get(id) ?? null;
}

/** Lightweight summary for the homepage "Supported Platforms" grid. */
export const supportedPlatforms = plugins.map((p) => ({
  id: p.id,
  name: p.name,
  capabilities: p.capabilities,
}));
