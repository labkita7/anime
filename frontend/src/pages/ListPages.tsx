import { useSearchParams } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { useAnimeList } from '../hooks/useAnimeList';
import type { Anime } from '../types';
import AnimeCard from '../components/AnimeCard';
import { SkeletonGrid } from '../components/SkeletonCard';
import ErrorState from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { Section } from '../components/SectionHeading';

function ListPage({ kind, title, subtitle }: { kind: 'ongoing' | 'complete'; title: string; subtitle: string }) {
  usePageMeta(title, `${title} — ${subtitle}. Katalog ${subtitle.toLowerCase()} dengan subtitle Indonesia.`);
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
  const { data, loading, error } = useAnimeList<Anime>(kind, page);

  const goTo = (p: number) => {
    setParams(p > 1 ? { page: String(p) } : {});
    window.scrollTo({ top: 0 });
  };

  return (
    <Section>
      <h1 className="text-xl font-bold text-white sm:text-2xl">{title}</h1>
      <p className="mb-4 text-sm text-gray-400">{subtitle}</p>
      {error ? (
        <ErrorState message={error.message} onRetry={() => goTo(page)} />
      ) : loading ? (
        <SkeletonGrid count={24} />
      ) : data && data.data.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {data.data.map((a) => (
              <AnimeCard key={a.id} anime={a} />
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onPage={goTo} />
        </>
      ) : (
        <EmptyState message={`Belum ada anime ${kind}.`} />
      )}
    </Section>
  );
}

export function Ongoing() {
  return <ListPage kind="ongoing" title="Ongoing Anime" subtitle="Sedang Tayang" />;
}

export function Complete() {
  return <ListPage kind="complete" title="Anime Tamat" subtitle="Complete" />;
}
