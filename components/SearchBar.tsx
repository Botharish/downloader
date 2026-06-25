"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ClipboardPaste, Loader2, Search } from "lucide-react";
import { urlSchema } from "@/lib/validator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({ url: urlSchema });
type FormValues = z.infer<typeof schema>;

interface SearchBarProps {
  defaultValue?: string;
  loading?: boolean;
  onSubmit: (url: string) => void;
  autoFocus?: boolean;
}

export function SearchBar({
  defaultValue = "",
  loading = false,
  onSubmit,
  autoFocus,
}: SearchBarProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { url: defaultValue },
  });

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setValue("url", text.trim(), { shouldValidate: true });
    } catch {
      /* clipboard permission denied — ignore */
    }
  }

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit(v.url))}
      className="w-full"
      noValidate
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            {...register("url")}
            autoFocus={autoFocus}
            placeholder="Paste a YouTube, Instagram, TikTok, X… link"
            className="pl-11 pr-12"
            aria-invalid={!!errors.url}
            inputMode="url"
          />
          <button
            type="button"
            onClick={paste}
            title="Paste from clipboard"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <ClipboardPaste className="size-4" />
          </button>
        </div>
        <Button type="submit" size="lg" disabled={loading} className="sm:w-40">
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Fetching…
            </>
          ) : (
            "Download"
          )}
        </Button>
      </div>
      {errors.url && (
        <p className="mt-2 text-sm text-destructive">{errors.url.message}</p>
      )}
    </form>
  );
}
