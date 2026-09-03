import { api } from '../lib/api';
import type { Anime, Page } from '../types';
import { usePageMeta } from '../hooks/usePageMeta';
import { getHistory } from '../lib/history';
import { useEffect, useState } from 'react';
import type { HistoryEntry } from '../lib/history';
import AnimeCard from '../components/AnimeCard';
import ContinueWatchingRow from '../components/ContinueWatchingRow';
import SectionHeading, { Section } from '../components/SectionHeading';
import { SkeletonGrid } from '../components/SkeletonCard';
import ErrorState from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';

export default function Home() {
  usePageMeta(undefined, siteDescription());
  const [ongoing, setOngoing] = useState<Page<Anime> | null>(null);
  const [complete, setComplete] = useState<Page<Anime> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([api.ongoing(1, 12), api.complete(1, 12)])
      .then(([o, c]) => {
        setOngoing(o);
        setComplete(c);
        setHistoryEntries(getHistory());
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <>
      <div className="container-page">
        <ContinueWatchingRow entries={historyEntries} />
      </div>
      <Section>
        <SectionHeading title="Ongoing Anime" subtitle="Sedang Tayang" moreTo="/ongoing" />
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <SkeletonGrid count={12} />
        ) : ongoing && ongoing.data.length > 0 ? (
          <CardGridWrap animes={ongoing.data} />
        ) : (
          <EmptyState message="Belum ada anime ongoing." />
        )}
      </Section>
      <Section>
        <SectionHeading title="Anime Tamat" subtitle="Complete" moreTo="/complete" />
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : loading ? (
          <SkeletonGrid count={12} />
        ) : complete && complete.data.length > 0 ? (
          <CardGridWrap animes={complete.data} />
        ) : (
          <EmptyState message="Belum ada anime complete." />
        )}
      </Section>
    </>
  );
}

function CardGridWrap({ animes }: { animes: Anime[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {animes.map((a) => (
        <AnimeCard key={a.id} anime={a} />
      ))}
    </div>
  );
}

function siteDescription() {
  return 'Katalog anime ongoing & tamat dengan subtitle Indonesia, riwayat tontonan, dan lanjutkan menonton.';
}
