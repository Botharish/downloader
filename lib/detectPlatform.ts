import { pluginForUrl } from "./platforms/registry";
import type { PlatformId } from "./platforms/types";

export interface DetectionResult {
  platform: PlatformId;
  name: string;
}

/**
 * Map a URL to its owning platform using the plugin registry. Returns null when
 * no registered platform claims the URL (the UI shows "Unsupported URL").
 */
export function detectPlatform(url: string): DetectionResult | null {
  const plugin = pluginForUrl(url.trim());
  if (!plugin) return null;
  return { platform: plugin.id, name: plugin.name };
}
