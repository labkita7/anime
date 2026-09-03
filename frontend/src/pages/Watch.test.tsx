import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import toast from 'react-hot-toast';
import Watch from './Watch';
import { api } from '../lib/api';
import type { StreamPayload } from '../types';

vi.mock('../lib/api', () => ({
  api: { stream: vi.fn(), detail: vi.fn() },
  ApiError: class ApiError extends Error {},
}));
vi.mock('../lib/history', () => ({
  markWatched: vi.fn(),
  upsertHistory: vi.fn(),
}));
vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), { error: vi.fn() }),
}));

function makePayload(overrides: Partial<StreamPayload> = {}): StreamPayload {
  return {
    title: 'Kage no Tabi Episode 1',
    animeSlug: 'kage-no-tabi-sub-indo',
    animeTitle: 'Kage no Tabi',
    posterUrl: null,
    episodeNumber: 1,
    synopsis: null,
    score: null,
    studio: null,
    genres: [],
    duration: null,
    releaseDay: null,
    status: 'ongoing',
    prevEpisodeSlug: null,
    nextEpisodeSlug: 'kage-no-tabi-episode-2',
    defaultPlayer: 'mega',
    streams: { '720p': [{ server: 'mega', mode: 'iframe', url: 'https://upstream.test/play/tok' }] },
    ...overrides,
  };
}

function renderWatch() {
  return render(
    <MemoryRouter initialEntries={['/watch/kage-no-tabi-episode-1']}>
      <Routes>
        <Route path="/watch/:episodeSlug" element={<Watch />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.mocked(toast).mockClear();
  vi.mocked(api.stream).mockReset();
  vi.mocked(api.detail).mockReset();
  vi.mocked(api.detail).mockResolvedValue({ episodes: [] } as never);
});

describe('Watch page', () => {
  it('menampilkan toast info saat enriching true', async () => {
    vi.mocked(api.stream).mockResolvedValue(makePayload({ enriching: true }));
    renderWatch();
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.stringContaining('disinkronkan'), expect.anything());
    });
  });

  it('tidak menampilkan toast saat enriching false/tidak ada', async () => {
    vi.mocked(api.stream).mockResolvedValue(makePayload());
    renderWatch();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /muat ulang sumber/i })).toBeInTheDocument();
    });
    expect(toast).not.toHaveBeenCalled();
  });

  it('tombol muat ulang memanggil stream dengan refresh=true', async () => {
    vi.mocked(api.stream).mockResolvedValue(makePayload());
    renderWatch();
    const button = await screen.findByRole('button', { name: /muat ulang sumber/i });
    fireEvent.click(button);
    await waitFor(() => {
      expect(api.stream).toHaveBeenCalledWith('kage-no-tabi-episode-1', true);
    });
  });
});
