/** Human-readable formatting helpers shared by the UI. */

export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function formatViews(views: number | null): string {
  if (!views || views <= 0) return "—";
  if (views >= 1_000_000_000) return `${(views / 1e9).toFixed(1)}B`;
  if (views >= 1_000_000) return `${(views / 1e6).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1e3).toFixed(1)}K`;
  return String(views);
}

export function formatBytes(bytes: number | undefined): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}
