import { Clock, Eye, User, ListVideo } from "lucide-react";
import type { MediaMetadata } from "@/lib/platforms/types";
import { formatDuration, formatViews } from "@/lib/format";
import { Card } from "@/components/ui/card";

/** Preview card: thumbnail + title + uploader/duration/views. */
export function VideoPreview({ metadata }: { metadata: MediaMetadata }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative aspect-video w-full shrink-0 bg-secondary sm:w-72">
          {metadata.thumbnail ? (
            // Thumbnails come from arbitrary platform CDNs; plain img avoids
            // next/image domain config churn and keeps this server-render simple.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              No preview
            </div>
          )}
          {metadata.duration ? (
            <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">
              {formatDuration(metadata.duration)}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col justify-center gap-3 p-4 sm:p-5 sm:pl-0">
          <h2 className="line-clamp-2 text-lg font-semibold leading-snug">
            {metadata.title}
          </h2>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {metadata.uploader && (
              <span className="inline-flex items-center gap-1.5">
                <User className="size-4" /> {metadata.uploader}
              </span>
            )}
            {metadata.duration != null && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" /> {formatDuration(metadata.duration)}
              </span>
            )}
            {metadata.views != null && (
              <span className="inline-flex items-center gap-1.5">
                <Eye className="size-4" /> {formatViews(metadata.views)} views
              </span>
            )}
            {metadata.isPlaylist && (
              <span className="inline-flex items-center gap-1.5">
                <ListVideo className="size-4" /> {metadata.entries ?? "?"} items
              </span>
            )}
          </div>
          <span className="w-fit rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize text-secondary-foreground">
            {metadata.platform}
          </span>
        </div>
      </div>
    </Card>
  );
}
