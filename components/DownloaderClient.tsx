"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { MediaMetadata } from "@/lib/platforms/types";
import { addHistory } from "@/lib/history";
import { SearchBar } from "@/components/SearchBar";
import { VideoPreview } from "@/components/VideoPreview";
import { DownloadOptions } from "@/components/DownloadOptions";
import { ProgressBar } from "@/components/ProgressBar";
import { ErrorCard } from "@/components/ErrorCard";

type Phase = "idle" | "fetching" | "ready" | "downloading" | "error";

const PLATFORMS_WITH_SUBS = new Set(["youtube", "vimeo"]);

export function DownloaderClient() {
  const router = useRouter();
  const params = useSearchParams();
  const initialUrl = params.get("url") ?? "";

  const [url, setUrl] = useState(initialUrl);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string>("");
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [percent, setPercent] = useState<number | null>(null);
  const lastFetched = useRef<string>("");

  const fetchMetadata = useCallback(async (target: string) => {
    if (!target) return;
    lastFetched.current = target;
    setPhase("fetching");
    setError("");
    setMetadata(null);
    setSelectedId(null);
    try {
      const res = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to fetch metadata");
      const meta = data.metadata as MediaMetadata;
      setMetadata(meta);
      // Default to the highest-quality video, else first option.
      const firstVideo = meta.formats.find((f) => f.kind === "video");
      setSelectedId((firstVideo ?? meta.formats[0])?.id ?? null);
      setPhase("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPhase("error");
    }
  }, []);

  // Auto-fetch when arriving with a ?url= param.
  useEffect(() => {
    if (initialUrl && initialUrl !== lastFetched.current) {
      setUrl(initialUrl);
      void fetchMetadata(initialUrl);
    }
  }, [initialUrl, fetchMetadata]);

  function onSearch(next: string) {
    setUrl(next);
    // Reflect the URL in the address bar for shareable/back-button behavior.
    router.replace(`/download?url=${encodeURIComponent(next)}`);
    void fetchMetadata(next);
  }

  async function streamToFile(res: Response, fallbackName: string) {
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] || fallbackName;
    const total = Number(res.headers.get("Content-Length")) || 0;

    if (!res.body) {
      // No streaming body — fall back to a plain blob.
      triggerSave(await res.blob(), filename);
      return;
    }

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    setPercent(total ? 0 : null);
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (total) setPercent((received / total) * 100);
    }
    triggerSave(new Blob(chunks as BlobPart[]), filename);
  }

  function triggerSave(blob: Blob, filename: string) {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  }

  async function onDownload() {
    if (!metadata || !selectedId) return;
    setPhase("downloading");
    setPercent(null);
    setError("");
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: metadata.webpageUrl,
          formatId: selectedId,
          title: metadata.title,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Download failed");
      }
      await streamToFile(res, `${metadata.title}.bin`);

      const fmt = metadata.formats.find((f) => f.id === selectedId);
      addHistory({
        url: metadata.webpageUrl,
        title: metadata.title,
        platform: metadata.platform,
        thumbnail: metadata.thumbnail,
        formatLabel: fmt?.label ?? selectedId,
      });
      setPhase("ready");
      setPercent(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
      setPhase("ready");
      setPercent(null);
    }
  }

  async function onDownloadSubtitle() {
    if (!metadata) return;
    setError("");
    try {
      const res = await fetch("/api/subtitle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: metadata.webpageUrl, lang: "en" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No subtitles available");
      }
      await streamToFile(res, `${metadata.title}.srt`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Subtitle download failed");
    }
  }

  const downloading = phase === "downloading";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <SearchBar
        defaultValue={url}
        onSubmit={onSearch}
        loading={phase === "fetching"}
        autoFocus={!initialUrl}
      />

      {phase === "error" && (
        <ErrorCard message={error} onRetry={() => setPhase("idle")} />
      )}

      {metadata && phase !== "error" && (
        <>
          <VideoPreview metadata={metadata} />

          {error && phase !== "downloading" && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {downloading && (
            <ProgressBar
              percent={percent}
              label={percent === null ? "Preparing on server…" : "Downloading…"}
            />
          )}

          <DownloadOptions
            formats={metadata.formats}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDownload={onDownload}
            downloading={downloading}
            subtitleSupported={PLATFORMS_WITH_SUBS.has(metadata.platform)}
            onDownloadSubtitle={onDownloadSubtitle}
          />
        </>
      )}

      {phase === "idle" && !metadata && (
        <p className="text-center text-sm text-muted-foreground">
          Paste a link above to fetch available formats.
        </p>
      )}
    </div>
  );
}
