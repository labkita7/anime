import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import type { Episode } from '../types';
import { isWatched } from '../lib/history';

export default function EpisodeList({
  episodes,
  currentSlug,
  currentAnimeSlug,
}: {
  episodes: Episode[];
  currentSlug?: string;
  currentAnimeSlug?: string;
}) {
  return (
    <ul role="list" className="divide-y divide-[#262a38] overflow-hidden rounded-md border border-[#262a38]">
      {episodes.map((ep) => {
        const active = currentSlug === ep.slug;
        return (
          <li key={ep.id}>
            <Link
              to={`/watch/${ep.slug}`}
              className={`flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-[#262a38] focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400 ${
                active ? 'bg-indigo-500/10' : ''
              }`}
            >
              <span className="min-w-0">
                <span className={`block truncate font-medium ${active ? 'text-indigo-300' : 'text-gray-200'}`}>
                  Episode {ep.episodeNumber}
                  {active ? ' · sedang ditonton' : isWatched(ep.slug) ? ' · selesai' : ''}
                </span>
                <span className="block truncate text-xs text-gray-500">{ep.title}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-gray-500">
                {ep.releaseDate ? <span>{ep.releaseDate}</span> : null}
                {currentAnimeSlug ? <Play className="h-4 w-4" aria-hidden /> : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
