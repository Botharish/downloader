import { z } from "zod";

/**
 * URL validation + light SSRF hardening. We only ever hand URLs to yt-dlp, but
 * we still reject obviously local/internal targets and non-http(s) schemes so a
 * pasted `file://` or `http://localhost` can't be coerced into a fetch.
 */

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

function isPrivateHost(host: string): boolean {
  if (BLOCKED_HOSTS.has(host)) return true;
  // RFC1918 + link-local ranges (best-effort; yt-dlp won't resolve these anyway).
  return (
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host.endsWith(".local")
  );
}

export const urlSchema = z
  .string()
  .trim()
  .min(1, "Paste a link to get started")
  .max(2048, "That URL is too long")
  .refine((val) => {
    try {
      const u = new URL(val.startsWith("http") ? val : `https://${val}`);
      if (u.protocol !== "http:" && u.protocol !== "https:") return false;
      if (isPrivateHost(u.hostname)) return false;
      return true;
    } catch {
      return false;
    }
  }, "Enter a valid http(s) link");

/** Normalize a user-pasted URL (prepend https:// when scheme is missing). */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

export const formatIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  // Only the synthetic ids our engine produces: h:1080, audio:mp3, thumb, image:best
  .regex(/^(h:(best|\d{2,4})|audio:[a-z0-9]+|image:best|thumb)$/i, "Unknown format");

export const metadataRequestSchema = z.object({
  url: urlSchema,
});

export const downloadRequestSchema = z.object({
  url: urlSchema,
  formatId: formatIdSchema,
  /** Optional friendly title for the download filename. */
  title: z.string().trim().max(200).optional(),
});

export type MetadataRequest = z.infer<typeof metadataRequestSchema>;
export type DownloadRequest = z.infer<typeof downloadRequestSchema>;
