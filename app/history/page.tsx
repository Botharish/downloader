"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, History as HistoryIcon, ExternalLink } from "lucide-react";
import {
  clearHistory,
  getHistory,
  type HistoryEntry,
} from "@/lib/history";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEntries(getHistory());
    setMounted(true);
  }, []);

  function onClear() {
    clearHistory();
    setEntries([]);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <HistoryIcon className="size-6" /> History
        </h1>
        {entries.length > 0 && (
          <Button variant="outline" size="sm" onClick={onClear}>
            <Trash2 /> Clear
          </Button>
        )}
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Stored only in this browser. Nothing about your downloads is kept on the
        server.
      </p>

      {mounted && entries.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No downloads yet.{" "}
            <Link href="/download" className="text-primary underline">
              Grab something
            </Link>
            .
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {entries.map((e) => (
          <Card key={e.id}>
            <CardContent className="flex items-center gap-4 p-3">
              <div className="h-14 w-24 shrink-0 overflow-hidden rounded-md bg-secondary">
                {e.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.thumbnail}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.title}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {e.platform} · {e.formatLabel} ·{" "}
                  {new Date(e.at).toLocaleString()}
                </p>
              </div>
              <Link
                href={`/download?url=${encodeURIComponent(e.url)}`}
                className="rounded-md p-2 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                title="Open again"
              >
                <ExternalLink className="size-4" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
