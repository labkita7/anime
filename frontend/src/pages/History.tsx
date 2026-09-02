import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePageMeta } from '../hooks/usePageMeta';
import {
  getHistory,
  removeHistory,
  clearHistory,
  type HistoryEntry,
} from '../lib/history';
import { formatRelativeTime } from '../lib/format';
import { Section } from '../components/SectionHeading';
import { EmptyState } from '../components/EmptyState';

export default function History() {
  usePageMeta('History', 'Riwayat tontonan tersimpan di perangkat Anda.');
  const [entries, setEntries] = useState<HistoryEntry[]>(() => getHistory());

  const removeOne = (entry: HistoryEntry) => {
    removeHistory(entry.animeSlug, entry.lastEpisodeSlug);
    setEntries(getHistory());
    toast.success('Riwayat dihapus');
  };

  const removeAll = () => {
    clearHistory();
    setEntries([]);
    toast.success('Semua riwayat dihapus');
  };

  return (
    <Section className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white sm:text-2xl">History</h1>
        {entries.length > 0 ? (
          <button
            type="button"
            onClick={removeAll}
            className="rounded-md border border-red-500/40 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
          >
            Hapus Semua
          </button>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <EmptyState message="Belum ada riwayat tontonan. Mulai tonton dari beranda!" />
      ) : (
        <ul role="list" className="space-y-2">
          {entries.map((e) => (
            <li
              key={`${e.animeSlug}-${e.lastEpisodeSlug}`}
              className="flex items-center gap-3 rounded-md bg-[#1a1d27] p-3"
            >
              {e.posterUrl ? (
                <img src={e.posterUrl} alt="" className="h-16 w-11 shrink-0 rounded object-cover" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-200">{e.animeTitle}</p>
                <p className="text-xs text-gray-500">
                  Terakhir Eps {e.lastEpisodeNumber} · {formatRelativeTime(e.watchedAt)}
                </p>
              </div>
              <Link
                to={`/watch/${e.lastEpisodeSlug}`}
                aria-label={`Lanjutkan ${e.animeTitle} episode ${e.lastEpisodeNumber}`}
                className="rounded-md bg-indigo-500 p-2 text-white hover:bg-indigo-400"
              >
                <Play className="h-4 w-4" aria-hidden />
              </Link>
              <button
                type="button"
                aria-label={`Hapus riwayat ${e.animeTitle}`}
                onClick={() => removeOne(e)}
                className="rounded-md p-2 text-gray-400 hover:bg-[#262a38] hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
