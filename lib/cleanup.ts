import { rm, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { DOWNLOAD_ROOT } from "./temp";

/**
 * Cleanup service. Two layers of defense against leftover media:
 *  1. Each request deletes its own temp dir in a `finally` (see /api/download).
 *  2. This sweep removes any temp dir older than the TTL, in case a process
 *     died before its `finally` ran. Invoked opportunistically per request.
 */

const TTL_MS = (Number(process.env.TEMP_TTL_MINUTES) || 30) * 60 * 1000;

/** Best-effort recursive delete; never throws into the request path. */
export async function removeDir(dir: string): Promise<void> {
  try {
    await rm(/*turbopackIgnore: true*/ dir, { recursive: true, force: true });
  } catch {
    /* ignore — sweep will catch stragglers */
  }
}

/** Delete temp dirs older than the TTL. Safe to call on every request. */
export async function sweepStaleTemp(): Promise<number> {
  let removed = 0;
  let entries: string[];
  try {
    entries = await readdir(/*turbopackIgnore: true*/ DOWNLOAD_ROOT);
  } catch {
    return 0;
  }

  const now = Date.now();
  await Promise.all(
    entries
      .filter((name) => name.startsWith("dl-"))
      .map(async (name) => {
        const dir = join(DOWNLOAD_ROOT, name);
        try {
          const info = await stat(/*turbopackIgnore: true*/ dir);
          if (now - info.mtimeMs > TTL_MS) {
            await removeDir(dir);
            removed += 1;
          }
        } catch {
          /* ignore */
        }
      }),
  );
  return removed;
}
