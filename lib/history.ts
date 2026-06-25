"use client";

import type { PlatformId } from "./platforms/types";

/**
 * Client-side download history, persisted to localStorage. Kept off the server
 * by design — no media or user activity is stored server-side.
 */

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  platform: PlatformId;
  thumbnail: string | null;
  formatLabel: string;
  at: number;
}

const KEY = "umd-history";
const LIMIT = 50;

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function addHistory(entry: Omit<HistoryEntry, "id" | "at">): void {
  try {
    const list = getHistory();
    list.unshift({ ...entry, id: crypto.randomUUID(), at: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, LIMIT)));
  } catch {
    /* ignore quota / disabled storage */
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
