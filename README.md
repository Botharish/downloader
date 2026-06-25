# Universal Media Downloader

A modular, plugin-based media downloader built with **Next.js 16 (App Router)**,
**React 19**, **TypeScript**, and **Tailwind CSS**. Each platform is an isolated
module sharing a common interface, so updating one platform never affects the
others. The download engine is a thin wrapper around **yt-dlp** + **FFmpeg**.

> ⚖️ **Responsible use.** Download only content you own or are authorized to
> download. Respect each platform's Terms of Service and applicable copyright
> law. Private / login-gated content requires you to supply your own
> authenticated cookies to yt-dlp.

## Supported platforms

YouTube · Instagram · TikTok · Facebook · Twitter/X · Pinterest · Reddit · Vimeo

## Requirements

- Node.js 20+
- [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) on your `PATH` (or set `YTDLP_PATH`)
- [`ffmpeg`](https://ffmpeg.org/) on your `PATH` (or set `FFMPEG_PATH`)

Verify both are reachable from the **Settings** page (or `GET /api/health`).

## Getting started

```bash
npm install
cp .env.example .env   # optional: customize binary paths / TTLs
npm run dev            # http://localhost:3000
```

## How it works

```
URL → validate → detect platform → load plugin → fetch metadata
    → user picks a format → download to temp dir → stream to browser
    → delete temp file
```

## Architecture

```
app/
  page.tsx              Home (paste + supported platforms)
  download/page.tsx     Download flow (preview + format picker)
  history/page.tsx      Local (browser-only) download history
  settings/page.tsx     Binary health + privacy
  api/
    metadata/route.ts   POST → normalized metadata + formats
    download/route.ts   POST → streams the chosen rendition
    thumbnail/route.ts  POST → streams the thumbnail
    subtitle/route.ts   POST → streams an .srt
    health/route.ts     GET  → yt-dlp / ffmpeg availability

lib/
  detectPlatform.ts     URL → platform (via registry)
  validator.ts          Zod schemas + SSRF guard
  ytdlp.ts              yt-dlp engine (info / download / probe)
  ffmpeg.ts             standalone transcode helper
  stream.ts             file → streamed Response (+ cleanup hook)
  temp.ts               per-request scratch dirs
  cleanup.ts            stale temp sweep + per-request delete
  platforms/
    types.ts            PlatformPlugin contract
    base.ts             createPlatform() factory
    <platform>.ts       one declarative file per platform
    registry.ts         single place every platform is registered
```

### Adding a new platform

1. Create `lib/platforms/<name>.ts` calling `createPlatform({ ... })` with the
   URL patterns and capabilities.
2. Register it in `lib/platforms/registry.ts`.

That's it — the API routes, UI, and detection pick it up automatically.

## Notes

- Files stream straight to the browser; the temporary server copy is deleted on
  stream close, with a TTL sweep as a backstop (`TEMP_TTL_MINUTES`).
- History lives in `localStorage` only — nothing is persisted server-side.
