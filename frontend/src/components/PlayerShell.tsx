import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import type { StreamPayload, StreamSource } from '../types';

function ServerQualitySwitcher({
  streams,
  selectedQuality,
  selectedServer,
  onSelect,
}: {
  streams: StreamPayload['streams'];
  selectedQuality: string;
  selectedServer: string | null;
  onSelect: (quality: string, server: string) => void;
}) {
  const qualities = Object.keys(streams);
  if (qualities.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Kualitas</span>
        {qualities.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSelect(q, streams[q][0]?.server ?? '')}
            aria-pressed={q === selectedQuality}
            className={`h-8 rounded-full px-3 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400 ${
              q === selectedQuality
                ? 'bg-indigo-500 text-white'
                : 'bg-[#262a38] text-gray-300 hover:bg-[#323750]'
            }`}
          >
            {q}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Server</span>
        {(streams[selectedQuality] ?? []).map((s) => (
          <button
            key={s.server}
            type="button"
            onClick={() => onSelect(selectedQuality, s.server)}
            aria-pressed={s.server === selectedServer}
            className={`h-8 rounded-full px-3 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400 ${
              s.server === selectedServer
                ? 'bg-indigo-500 text-white'
                : 'bg-[#262a38] text-gray-300 hover:bg-[#323750]'
            }`}
          >
            {s.server}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PlayerShell({
  payload,
  poster,
}: {
  payload: StreamPayload;
  poster: string | null;
}) {
  const qualities = useMemo(() => Object.keys(payload.streams), [payload.streams]);
  const [quality, setQuality] = useState(() => {
    const preferred = qualities.find((q) =>
      payload.streams[q].some((s) => s.server === payload.defaultPlayer)
    );
    return preferred ?? qualities[0] ?? '720p';
  });
  const [server, setServer] = useState<string | null>(() => {
    const first = qualities[0] ? payload.streams[qualities[0]]?.[0] : undefined;
    return payload.defaultPlayer ?? first?.server ?? null;
  });

  // reset pilihan saat pindah episode
  useEffect(() => {
    const preferredQuality =
      qualities.find((q) => payload.streams[q].some((s) => s.server === payload.defaultPlayer)) ??
      qualities[0];
    setQuality(preferredQuality ?? '720p');
    setServer(payload.defaultPlayer ?? payload.streams[preferredQuality ?? '']?.[0]?.server ?? null);
  }, [payload, qualities]);

  const current: StreamSource | null = useMemo(() => {
    const list = payload.streams[quality] ?? [];
    return list.find((s) => s.server === server) ?? list[0] ?? null;
  }, [payload.streams, quality, server]);

  const videoRef = useRef<HTMLVideoElement>(null);

  const onSelect = (q: string, s: string) => {
    if (!payload.streams[q]?.some((src) => src.server === s)) {
      return;
    }
    setQuality(q);
    setServer(s);
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
        {!current ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Tidak ada sumber video tersedia
          </div>
        ) : current.mode === 'native' ? (
          <video
            ref={videoRef}
            key={`${quality}-${current.server}`}
            className="h-full w-full"
            controls
            playsInline
            poster={poster ?? undefined}
            onError={() => {
              toast.error(
                `Sumber ${current.server} (${quality}) bermasalah — pilih server lain di bawah`
              );
            }}
          >
            <source src={current.url} />
          </video>
        ) : (
          <iframe
            key={`${quality}-${current.server}`}
            src={current.url}
            title={payload.title}
            className="h-full w-full"
            sandbox="allow-scripts allow-same-origin"
            allow="autoplay; fullscreen; encrypted-media"
          />
        )}
      </div>
      <ServerQualitySwitcher
        streams={payload.streams}
        selectedQuality={quality}
        selectedServer={current?.server ?? null}
        onSelect={onSelect}
      />
    </div>
  );
}
