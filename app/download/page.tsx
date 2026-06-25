import { Suspense } from "react";
import { DownloaderClient } from "@/components/DownloaderClient";

export const metadata = {
  title: "Download · Universal Media Downloader",
};

export default function DownloadPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <DownloaderClient />
    </Suspense>
  );
}
