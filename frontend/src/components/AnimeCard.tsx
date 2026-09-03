import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Anime } from '../types';
import { formatScore } from '../lib/format';
import PosterImage from './PosterImage';

export function Badge({
  status,
  className = '',
}: {
  status: 'ongoing' | 'complete';
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        status === 'ongoing'
          ? 'bg-indigo-500/20 text-indigo-300'
          : 'bg-emerald-500/20 text-emerald-300'
      } ${className}`}
    >
      {status}
    </span>
  );
}

export default function AnimeCard({ anime }: { anime: Anime }) {
  return (
    <Link
      to={`/anime/${anime.slug}`}
      className="group block overflow-hidden rounded-md bg-[#1a1d27] transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
      aria-label={anime.title}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#262a38]">
        <PosterImage src={anime.posterUrl} alt={anime.title} className="h-full w-full object-cover" />
        <div className="absolute left-2 top-2">
          <Badge status={anime.status} />
        </div>
      </div>
      <div className="p-2">
        <h3 className="line-clamp-2 text-sm font-medium text-gray-200 group-hover:text-white">
          {anime.title}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
          <Star className="h-3 w-3 text-amber-400" aria-hidden />
          {formatScore(anime.score)}
          {anime.type ? <span className="ml-1">· {anime.type}</span> : null}
        </p>
      </div>
    </Link>
  );
}
