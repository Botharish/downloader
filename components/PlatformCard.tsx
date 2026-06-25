import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Music2,
  Image as ImageIcon,
  MessageCircle,
  Clapperboard,
  type LucideIcon,
} from "lucide-react";
import type { PlatformId } from "@/lib/platforms/types";

const ICONS: Record<PlatformId, LucideIcon> = {
  youtube: Youtube,
  instagram: Instagram,
  tiktok: Music2,
  facebook: Facebook,
  twitter: Twitter,
  pinterest: ImageIcon,
  reddit: MessageCircle,
  vimeo: Clapperboard,
};

const ACCENT: Record<PlatformId, string> = {
  youtube: "text-red-500",
  instagram: "text-pink-500",
  tiktok: "text-foreground",
  facebook: "text-blue-600",
  twitter: "text-sky-500",
  pinterest: "text-rose-500",
  reddit: "text-orange-500",
  vimeo: "text-cyan-500",
};

export function PlatformCard({
  id,
  name,
}: {
  id: PlatformId;
  name: string;
}) {
  const Icon = ICONS[id];
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card/50 p-4 text-center transition-colors hover:border-primary/40 hover:bg-card">
      <Icon className={`size-7 ${ACCENT[id]}`} />
      <span className="text-sm font-medium">{name}</span>
    </div>
  );
}
