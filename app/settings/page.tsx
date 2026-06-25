"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, RefreshCw, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clearHistory } from "@/lib/history";

interface Health {
  status: string;
  ytdlp: string | null;
  ffmpeg: string | null;
  platforms: string[];
}

export default function SettingsPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleared, setCleared] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      setHealth(await res.json());
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>System status</CardTitle>
          <Button variant="ghost" size="icon" onClick={load} aria-label="Refresh">
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <StatusRow label="yt-dlp" value={health?.ytdlp ?? null} />
          <StatusRow label="FFmpeg" value={health?.ffmpeg ?? null} />
          <div className="pt-1 text-muted-foreground">
            {health?.platforms?.length
              ? `${health.platforms.length} platforms registered: ${health.platforms.join(", ")}`
              : "—"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
          <p>
            History is stored only in your browser&apos;s local storage.
            Downloaded files stream directly to you and the temporary server-side
            copy is deleted immediately afterward.
          </p>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearHistory();
                setCleared(true);
              }}
            >
              <Trash2 /> Clear local history
            </Button>
            {cleared && (
              <span className="ml-3 text-xs text-primary">Cleared.</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responsible use</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Only download content you own or are authorized to download. Private
          or login-gated content (e.g. Instagram stories) requires you to supply
          your own authenticated cookies to yt-dlp and is your responsibility to
          use in line with each platform&apos;s Terms of Service and copyright
          law.
        </CardContent>
      </Card>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string | null }) {
  const ok = Boolean(value);
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium">{label}</span>
      <span
        className={`inline-flex items-center gap-1.5 ${ok ? "text-emerald-500" : "text-destructive"}`}
      >
        {ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
        <span className="max-w-[16rem] truncate text-xs">
          {value ?? "Not found"}
        </span>
      </span>
    </div>
  );
}
