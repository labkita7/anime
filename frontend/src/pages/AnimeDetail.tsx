import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import type { AnimeDetail as AnimeDetailType } from '../types';
import { usePageMeta } from '../hooks/usePageMeta';
import { Badge } from '../components/AnimeCard';
import EpisodeList from '../components/EpisodeList';
import { SkeletonGrid } from '../components/SkeletonCard';
import ErrorState from '../components/ErrorState';
import { formatScore } from '../lib/format';
import { Section } from '../components/SectionHeading';

export default function AnimeDetail() {
  const { slug = '' } = useParams();
  const [data, setData] = useState<AnimeDetailType | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [episodePage, setEpisodePage] = useState(1);

  usePageMeta(data?.title, data?.synopsis?.slice(0, 150));

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .detail(slug, episodePage, 100)
      .then(setData)
      .catch((err: ApiError) => setError(err))
      .finally(() => setLoading(false));
  };

  useEffect(load, [slug, episodePage]);

  if (loading && !data) {
    return (
      <Section>
        <SkeletonGrid count={6} />
      </Section>
    );
  }

  if (error) {
    return (
      <Section>
        {error.status === 404 ? (
          <div className="py-16 text-center">
            <p className="text-lg font-semibold text-white">Anime tidak ditemukan</p>
            <p className="mt-1 text-sm text-gray-400">Periksa kembali tautan atau kembali ke beranda.</p>
          </div>
        ) : (
          <ErrorState message={error.message} onRetry={load} />
        )}
      </Section>
    );
  }

  if (!data) return null;

  return (
    <Section>
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="w-40 shrink-0 sm:w-52">
          <div className="aspect-[2/3] overflow-hidden rounded-md bg-[#262a38]">
            {data.posterUrl ? (
              <img src={data.posterUrl} alt={data.title} className="h-full w-full object-cover" />
            ) : null}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge status={data.status} />
            <span className="text-xs text-gray-400">{data.type}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white">{data.title}</h1>
          {data.japaneseTitle ? (
            <p className="text-sm text-gray-400">{data.japaneseTitle}</p>
          ) : null}
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:max-w-md">
            <dt className="text-gray-500">Skor</dt>
            <dd className="text-gray-200">{formatScore(data.score)}</dd>
            <dt className="text-gray-500">Studio</dt>
            <dd className="text-gray-200">{data.studio ?? '–'}</dd>
            <dt className="text-gray-500">Durasi</dt>
            <dd className="text-gray-200">{data.duration ?? '–'}</dd>
            <dt className="text-gray-500">Jadwal</dt>
            <dd className="text-gray-200">
              {data.releaseDay ?? '–'}
              {data.releaseDate ? ` · ${data.releaseDate}` : ''}
            </dd>
            <dt className="text-gray-500">Episode</dt>
            <dd className="text-gray-200">{data.totalEpisodes ?? data.totalEpisodeCount}</dd>
            <dt className="text-gray-500">Genre</dt>
            <dd className="flex flex-wrap gap-1">
              {data.genres.map((g) => (
                <span key={g} className="rounded-full bg-[#262a38] px-2 py-0.5 text-xs text-gray-300">
                  {g}
                </span>
              ))}
            </dd>
          </dl>
          {data.synopsis ? (
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-300">{data.synopsis}</p>
          ) : null}
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold text-white">Daftar Episode</h2>
      {loading ? (
        <SkeletonGrid count={3} />
      ) : (
        <>
          <EpisodeList episodes={data.episodes} />
          {data.episodeTotalPages > 1 ? (
            <div className="mt-3 flex items-center justify-between text-sm">
              <button
                type="button"
                className="rounded-md bg-[#262a38] px-3 py-2 text-gray-300 hover:bg-[#323750] disabled:opacity-40"
                disabled={episodePage <= 1}
                onClick={() => setEpisodePage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </button>
              <span className="text-gray-400">
                Hal {data.episodePage} / {data.episodeTotalPages}
              </span>
              <button
                type="button"
                className="rounded-md bg-[#262a38] px-3 py-2 text-gray-300 hover:bg-[#323750] disabled:opacity-40"
                disabled={!data.episodeHasMore}
                onClick={() => setEpisodePage((p) => p + 1)}
              >
                Berikutnya
              </button>
            </div>
          ) : null}
        </>
      )}
    </Section>
  );
}
