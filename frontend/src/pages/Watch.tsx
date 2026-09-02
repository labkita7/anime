import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { StreamPayload } from '../types';
import { usePageMeta } from '../hooks/usePageMeta';
import { upsertHistory, markWatched } from '../lib/history';
import PlayerShell from '../components/PlayerShell';
import EpisodeList from '../components/EpisodeList';
import ErrorState from '../components/ErrorState';
import { SkeletonCard } from '../components/SkeletonCard';
import { formatScore } from '../lib/format';
import { Section } from '../components/SectionHeading';

export default function Watch() {
  const { episodeSlug = '' } = useParams();
  const [data, setData] = useState<StreamPayload | null>(null);
  const [episodes, setEpisodes] = useState<Awaited<ReturnType<typeof api.detail>>['episodes']>([]);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);

  usePageMeta(data?.title, data?.synopsis?.slice(0, 150));

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .stream(episodeSlug)
      .then((payload) => {
        setData(payload);
        markWatched(episodeSlug);
        upsertHistory({
          animeSlug: payload.animeSlug,
          animeTitle: payload.animeTitle,
          posterUrl: payload.posterUrl,
          lastEpisodeSlug: episodeSlug,
          lastEpisodeNumber: payload.episodeNumber,
        });
        return api.detail(payload.animeSlug).then((detail) => setEpisodes(detail.episodes));
      })
      .catch((err: ApiError) => setError(err))
      .finally(() => setLoading(false));
  };

  useEffect(load, [episodeSlug]);

  if (error) {
    return (
      <Section>
        <ErrorState message={error.message} onRetry={load} />
      </Section>
    );
  }

  if (loading || !data) {
    return (
      <Section>
        <div className="aspect-video w-full animate-pulse rounded-md bg-[#262a38]" />
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <div className="mx-auto max-w-5xl">
        <PlayerShell payload={data} poster={data.posterUrl} />

        <div className="mt-4 flex items-center justify-between gap-2">
          {data.prevEpisodeSlug ? (
            <Link
              to={`/watch/${data.prevEpisodeSlug}`}
              className="flex items-center gap-1 rounded-md bg-[#262a38] px-3 py-2 text-sm text-gray-200 hover:bg-[#323750]"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden /> Episode {data.episodeNumber - 1}
            </Link>
          ) : (
            <span />
          )}
          {data.nextEpisodeSlug ? (
            <Link
              to={`/watch/${data.nextEpisodeSlug}`}
              className="flex items-center gap-1 rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400"
            >
              Episode {data.episodeNumber + 1} <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </div>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row">
          <div className="w-full min-w-0 sm:w-2/3">
            <h1 className="text-lg font-bold text-white">{data.title}</h1>
            <p className="mt-1 text-sm text-gray-400">
              Studio {data.studio ?? '–'} · Skor {formatScore(data.score)}
            </p>
            {data.synopsis ? (
              <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-gray-300">{data.synopsis}</p>
            ) : null}
          </div>
          <div className="w-full shrink-0 sm:w-1/3">
            {data.posterUrl ? (
              <img
                src={data.posterUrl}
                alt={data.animeTitle}
                className="w-32 rounded-md sm:w-full"
                loading="lazy"
              />
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          <Link to={`/anime/${data.animeSlug}`} className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
            Lihat semua info {data.animeTitle}
          </Link>
        </div>

        <h2 className="mb-3 mt-8 text-lg font-bold text-white">Episode Lainnya</h2>
        <EpisodeList episodes={episodes} currentSlug={episodeSlug} currentAnimeSlug={data.animeSlug} />
      </div>
    </Section>
  );
}
