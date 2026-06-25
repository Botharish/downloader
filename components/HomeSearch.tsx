"use client";

import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";

/** Home hero search: routes to the download page with the pasted URL. */
export function HomeSearch() {
  const router = useRouter();
  return (
    <SearchBar
      autoFocus
      onSubmit={(url) => router.push(`/download?url=${encodeURIComponent(url)}`)}
    />
  );
}
