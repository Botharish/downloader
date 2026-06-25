import { ShieldCheck, Zap, Layers } from "lucide-react";
import { HomeSearch } from "@/components/HomeSearch";
import { PlatformCard } from "@/components/PlatformCard";
import { supportedPlatforms } from "@/lib/platforms/registry";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 py-16 text-center sm:py-24">
        <span className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          8 platforms · one paste
        </span>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Universal Media Downloader
        </h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Paste a link and download videos, audio, images, or thumbnails from
          the platforms you use — fast, with no account required.
        </p>
        <div className="w-full max-w-2xl">
          <HomeSearch />
        </div>
      </section>

      {/* Supported platforms */}
      <section className="py-8">
        <h2 className="mb-5 text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Supported Platforms
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {supportedPlatforms.map((p) => (
            <PlatformCard key={p.id} id={p.id} name={p.name} />
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="grid gap-4 py-12 sm:grid-cols-3">
        <Feature
          icon={<Layers className="size-5" />}
          title="Plugin architecture"
          body="Each platform is an isolated module. Updating one never breaks the others."
        />
        <Feature
          icon={<Zap className="size-5" />}
          title="Stream, don't store"
          body="Files stream straight to your browser and temporary copies are deleted right after."
        />
        <Feature
          icon={<ShieldCheck className="size-5" />}
          title="Use it responsibly"
          body="Built for content you own or are authorized to download, respecting platform terms."
        />
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5">
      <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
