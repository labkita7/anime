import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeStatus, mapAnime, mapEpisode, mapSearchItem, mapStreamPayload } from './mappers.js';

const fixture = (name) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url)), 'utf8'));

const PLAY_BASE = 'https://upstream.example/api/v1/play';

describe('normalizeStatus', () => {
  it('memetakan completed -> complete, sisanya tetap ongoing', () => {
    expect(normalizeStatus('completed')).toBe('complete');
    expect(normalizeStatus('ongoing')).toBe('ongoing');
    expect(normalizeStatus(undefined)).toBe('ongoing');
  });
});

describe('mapAnime', () => {
  it('memetakan item fixture ongoing ke domain kontrak PRD §8', () => {
    const dto = fixture('ongoing-p1.json').data[0];
    const anime = mapAnime(dto);
    expect(Object.keys(anime)).toEqual([
      'id', 'slug', 'title', 'japaneseTitle', 'posterUrl', 'synopsis', 'score', 'status',
      'type', 'totalEpisodes', 'duration', 'releaseDay', 'releaseDate', 'studio', 'genres', 'sortOrder',
    ]);
    expect(anime.status).toBe('ongoing');
    expect(Array.isArray(anime.genres)).toBe(true);
    expect(anime.posterUrl).toMatch(/^https:/);
  });

  it('memetakan item complete (status completed -> complete, totalEpisodes string)', () => {
    const dto = fixture('complete-p1.json').data[0];
    const anime = mapAnime(dto);
    expect(anime.status).toBe('complete');
    expect(typeof anime.totalEpisodes).toBe('string');
  });

  it('tahan field null (synopsis, studio, genres)', () => {
    const anime = mapAnime({ id: 1, slug: 'x', title: 'X', status: 'ongoing', genres: null, score: null });
    expect(anime.genres).toEqual([]);
    expect(anime.score).toBeNull();
    expect(anime.synopsis).toBeNull();
  });

  it('mengembalikan null untuk dto kosong', () => {
    expect(mapAnime(null)).toBeNull();
  });
});

describe('mapEpisode', () => {
  it('memetakan episode dari fixture detail', () => {
    const dto = fixture('detail-otome.json').episodes[0];
    const ep = mapEpisode(dto);
    expect(ep).toMatchObject({ slug: dto.slug, episodeNumber: dto.episodeNumber, title: dto.title });
  });
});

describe('mapSearchItem', () => {
  it('memetakan poster -> posterUrl dan status ke kontrak kita', () => {
    const dto = fixture('search-otome.json').data[0];
    const item = mapSearchItem(dto);
    expect(item).toEqual({
      title: dto.title,
      slug: dto.slug,
      posterUrl: dto.poster,
      status: 'ongoing',
      score: dto.score,
    });
  });
});

describe('mapStreamPayload', () => {
  const dto = fixture('stream-episode-9.json');

  it('memetakan snake_case -> camelCase dan token -> URL /play mode iframe', () => {
    const payload = mapStreamPayload(dto, PLAY_BASE, 'otgsmbosd-s2-episode-9-sub-indo');
    expect(payload.anime).toMatchObject({
      slug: dto.anime_slug,
      title: dto.anime_title,
      posterUrl: dto.poster_url,
    });
    expect(payload.episode).toMatchObject({
      slug: 'otgsmbosd-s2-episode-9-sub-indo',
      episodeNumber: dto.episode_number,
    });
    expect(Object.keys(payload.streams)).toEqual(['720p', '480p', '360p']);
    for (const sources of Object.values(payload.streams)) {
      for (const s of sources) {
        expect(s.mode).toBe('iframe');
        expect(s.url).toMatch(/^https:\/\/upstream\.example\/api\/v1\/play\/[0-9a-f-]{36}$/);
      }
    }
  });

  it('mengenali defaultPlayer dari token default_player upstream', () => {
    const payload = mapStreamPayload(dto, PLAY_BASE, 'x');
    const defaultEntry = Object.values(dto.streams)
      .flat()
      .find((s) => s.token === dto.default_player);
    expect(payload.defaultPlayer).toBe(defaultEntry.server);
  });

  it('meneruskan prev/next dan enriching', () => {
    const payload = mapStreamPayload(dto, PLAY_BASE, 'x');
    expect(payload.prevEpisodeSlug).toBe(dto.prev_episode_slug);
    expect(payload.nextEpisodeSlug).toBe(dto.next_episode_slug);
    expect(typeof payload.enriching).toBe('boolean');
  });

  it('defaultPlayer null bila default_player tidak cocok / tidak ada', () => {
    const payload = mapStreamPayload({ ...dto, default_player: null }, PLAY_BASE, 'x');
    expect(payload.defaultPlayer).toBeNull();
  });
});
