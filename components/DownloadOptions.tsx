"use client";

import { Download, FileVideo, Music, ImageDown, Captions } from "lucide-react";
import type { MediaFormat } from "@/lib/platforms/types";
import { formatBytes } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DownloadOptionsProps {
  formats: MediaFormat[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDownload: () => void;
  downloading: boolean;
  /** Whether this platform exposes subtitles (renders the subtitle action). */
  subtitleSupported: boolean;
  onDownloadSubtitle?: () => void;
}

const KIND_ICON = {
  video: FileVideo,
  audio: Music,
  image: ImageDown,
} as const;

export function DownloadOptions({
  formats,
  selectedId,
  onSelect,
  onDownload,
  downloading,
  subtitleSupported,
  onDownloadSubtitle,
}: DownloadOptionsProps) {
  if (formats.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No downloadable formats were found for this link.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a format</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {formats.map((f) => {
            const Icon = KIND_ICON[f.kind];
            const active = selectedId === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelect(f.id)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border hover:border-primary/40 hover:bg-secondary/50",
                )}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Icon className="size-4" /> {f.label}
                </span>
                <span className="text-xs uppercase text-muted-foreground">
                  {f.ext}
                  {f.filesize ? ` · ${formatBytes(f.filesize)}` : ""}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={onDownload}
            disabled={!selectedId || downloading}
            className="flex-1"
            size="lg"
          >
            <Download /> {downloading ? "Preparing…" : "Download"}
          </Button>
          {subtitleSupported && onDownloadSubtitle && (
            <Button
              onClick={onDownloadSubtitle}
              variant="outline"
              size="lg"
              disabled={downloading}
            >
              <Captions /> Subtitles
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
