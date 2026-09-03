import { site } from '../config/site';

export interface HistoryEntry {
  animeSlug: string;
  animeTitle: string;
  posterUrl: string | null;
  lastEpisodeSlug: string;
  lastEpisodeNumber: number;
  watchedAt: number;
}

const MAX_ENTRIES = 50;

function read(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(site.historyKey);
    const parsed = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(entries: HistoryEntry[]) {
  localStorage.setItem(site.historyKey, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function getHistory(): HistoryEntry[] {
  return read();
}

export function upsertHistory(entry: Omit<HistoryEntry, 'watchedAt'>) {
  const entries = read().filter(
    (e) => !(e.animeSlug === entry.animeSlug && e.lastEpisodeSlug === entry.lastEpisodeSlug)
  );
  const perAnimeRemoved = entries.filter((e) => e.animeSlug !== entry.animeSlug);
  write([{ ...entry, watchedAt: Date.now() }, ...perAnimeRemoved]);
}

export function removeHistory(animeSlug: string, lastEpisodeSlug?: string) {
  write(
    read().filter(
      (e) =>
        e.animeSlug !== animeSlug ||
        (lastEpisodeSlug !== undefined && e.lastEpisodeSlug !== lastEpisodeSlug)
    )
  );
}

export function clearHistory() {
  localStorage.removeItem(site.historyKey);
}

export function markWatched(episodeSlug: string) {
  try {
    const raw = localStorage.getItem(site.watchedKey);
    const set = new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
    set.add(episodeSlug);
    localStorage.setItem(site.watchedKey, JSON.stringify([...set].slice(-500)));
  } catch {
    // storage rusak/penuh: abaikan
  }
}

export function isWatched(episodeSlug: string): boolean {
  try {
    const raw = localStorage.getItem(site.watchedKey);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    return arr.includes(episodeSlug);
  } catch {
    return false;
  }
}
