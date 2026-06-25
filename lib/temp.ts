import { mkdtemp, readdir, stat } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

/**
 * Temporary storage helpers. Each download gets its own scratch directory so
 * yt-dlp's `--restrict-filenames` output can't collide between requests.
 */

export const DOWNLOAD_ROOT = path.resolve(
  /*turbopackIgnore: true*/ process.env.DOWNLOAD_DIR ||
    path.join(/*turbopackIgnore: true*/ process.cwd(), "downloads"),
);

function ensureRoot(): void {
  if (!existsSync(/*turbopackIgnore: true*/ DOWNLOAD_ROOT)) {
    mkdirSync(/*turbopackIgnore: true*/ DOWNLOAD_ROOT, { recursive: true });
  }
}

/** Create a fresh per-request temp directory and return its absolute path. */
export async function createTempDir(): Promise<string> {
  ensureRoot();
  return mkdtemp(/*turbopackIgnore: true*/ path.join(DOWNLOAD_ROOT, "dl-"));
}

/**
 * Return the absolute path of the produced media file inside a temp dir.
 *
 * yt-dlp may leave intermediate fragments if a step fails; we ignore `.part`
 * files and pick the *largest* remaining file, which is the real media (and the
 * merged output rather than a leftover single stream).
 */
export async function findProducedFile(dir: string): Promise<string | null> {
  const names = (await readdir(/*turbopackIgnore: true*/ dir)).filter(
    (f) => !f.endsWith(".part"),
  );
  if (names.length === 0) return null;

  let best: { path: string; size: number } | null = null;
  for (const name of names) {
    const filePath = path.join(dir, name);
    try {
      const info = await stat(/*turbopackIgnore: true*/ filePath);
      if (!info.isFile()) continue;
      if (!best || info.size > best.size) best = { path: filePath, size: info.size };
    } catch {
      /* ignore unreadable entries */
    }
  }
  return best?.path ?? null;
}
