import { describe, it, expect } from 'vitest';
import { getHistory, upsertHistory, removeHistory, clearHistory, isWatched, markWatched } from './history';

const entry = {
  animeSlug: 'kage-no-tabi-sub-indo',
  animeTitle: 'Kage no Tabi',
  posterUrl: '/posters/kage-no-tabi-sub-indo.svg',
  lastEpisodeSlug: 'kage-no-tabi-episode-1',
  lastEpisodeNumber: 1,
};

describe('history (localStorage)', () => {
  it('upsert menambah entri terbaru di atas', () => {
    upsertHistory(entry);
    upsertHistory({ ...entry, lastEpisodeSlug: 'kage-no-tabi-episode-2', lastEpisodeNumber: 2 });
    const list = getHistory();
    expect(list).toHaveLength(1); // satu anime = satu entri terakhir
    expect(list[0].lastEpisodeSlug).toBe('kage-no-tabi-episode-2');
  });

  it('upsert anime berbeda tetap tersimpan keduanya', () => {
    upsertHistory(entry);
    upsertHistory({ ...entry, animeSlug: 'yume-no-hashira-sub-indo', animeTitle: 'Yume no Hashira', lastEpisodeSlug: 'yume-no-hashira-episode-1' });
    expect(getHistory()).toHaveLength(2);
  });

  it('membatasi maksimal 50 entri', () => {
    for (let i = 0; i < 60; i++) {
      upsertHistory({ ...entry, animeSlug: `anime-${i}`, lastEpisodeSlug: `anime-${i}-episode-1` });
    }
    expect(getHistory().length).toBe(50);
  });

  it('removeHistory menghapus entri spesifik', () => {
    upsertHistory(entry);
    upsertHistory({ ...entry, animeSlug: 'anime-2', lastEpisodeSlug: 'anime-2-episode-1' });
    removeHistory('kage-no-tabi-sub-indo');
    expect(getHistory()).toHaveLength(1);
    expect(getHistory()[0].animeSlug).toBe('anime-2');
  });

  it('clearHistory mengosongkan riwayat', () => {
    upsertHistory(entry);
    clearHistory();
    expect(getHistory()).toHaveLength(0);
  });

  it('markWatched/isWatched bekerja', () => {
    expect(isWatched('ep-1')).toBe(false);
    markWatched('ep-1');
    expect(isWatched('ep-1')).toBe(true);
  });
});
