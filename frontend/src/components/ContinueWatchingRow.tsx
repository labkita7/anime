import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import type { HistoryEntry } from '../lib/history';
import { formatRelativeTime } from '../lib/format';

export default function ContinueWatchingRow({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <section aria-label="Lanjutkan Menonton" className="py-6">
      <h2 className="mb-4 text-lg font-bold text-white sm:text-xl">Lanjutkan Menonton</h2>
      <div className="flex gap-3 overflow-x-auto pb-2" role="list">
        {entries.slice(0, 12).map((e) => (
          <Link
            key={`${e.animeSlug}-${e.lastEpisodeSlug}`}
            to={`/watch/${e.lastEpisodeSlug}`}
            role="listitem"
            className="group w-56 shrink-0 overflow-hidden rounded-md bg-[#1a1d27] transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
          >
            <div className="relative aspect-video w-full bg-[#262a38]">
              {e.posterUrl ? (
                <img src={e.posterUrl} alt={e.animeTitle} className="h-full w-full object-cover" />
              ) : null}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <Play className="h-10 w-10 text-white" aria-hidden />
              </div>
            </div>
            <div className="p-2">
              <p className="truncate text-sm font-medium text-gray-200">{e.animeTitle}</p>
              <p className="text-xs text-gray-500">
                Eps {e.lastEpisodeNumber} · {formatRelativeTime(e.watchedAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
