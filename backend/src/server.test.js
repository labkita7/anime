import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from './server.js';

let srv;
let base;

beforeAll(() => {
  return new Promise((resolve) => {
    srv = createApp().listen(0, () => {
      base = `http://localhost:${srv.address().port}/api/v1`;
      resolve();
    });
  });
});

afterAll(() => {
  return new Promise((resolve) => srv.close(resolve));
});

describe('GET /health', () => {
  it('mengembalikan status ok', async () => {
    const res = await fetch(`${base}/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});

describe('GET /anime/ongoing', () => {
  it('mengembalikan Page<Anime> dengan meta dan field camelCase', async () => {
    const res = await fetch(`${base}/anime/ongoing?page=1&limit=5`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(5);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(5);
    expect(body.totalPages).toBe(Math.ceil(body.total / 5));
    const a = body.data[0];
    expect(Object.keys(a)).toEqual(
      expect.arrayContaining(['slug', 'title', 'japaneseTitle', 'posterUrl', 'synopsis', 'score', 'status', 'genres', 'sortOrder'])
    );
    expect(Array.isArray(a.genres)).toBe(true);
    expect(a.status).toBe('ongoing');
  });

  it('mengembalikan data hanya status complete pada /complete', async () => {
    const res = await fetch(`${base}/anime/complete?page=1&limit=50`);
    const body = await res.json();
    expect(body.data.every((a) => a.status === 'complete')).toBe(true);
  });
});

describe('GET /anime/detail/:slug', () => {
  it('mengembalikan anime + episodes + meta episode', async () => {
    const res = await fetch(`${base}/anime/detail/kage-no-tabi-sub-indo?page=1&limit=3`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slug).toBe('kage-no-tabi-sub-indo');
    expect(body.episodes).toHaveLength(3);
    expect(body.episodes[0]).toMatchObject({ slug: 'kage-no-tabi-episode-1', episodeNumber: 1 });
    expect(body.totalEpisodeCount).toBe(8);
    expect(body.episodeTotalPages).toBe(3);
    expect(body.episodeHasMore).toBe(true);
  });

  it('404 dengan {"error"} untuk slug tak dikenal', async () => {
    const res = await fetch(`${base}/anime/detail/tidak-ada`);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Anime tidak ditemukan' });
  });
});

describe('GET /anime/search', () => {
  it('menolak q pendek dengan 400', async () => {
    const res = await fetch(`${base}/anime/search?q=k`);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/2 karakter/);
  });

  it('mengembalikan SearchItem ringkas', async () => {
    const res = await fetch(`${base}/anime/search?q=kage`);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.query).toBe('kage');
    expect(body.totalResults).toBe(body.data.length);
    expect(body.data[0]).toMatchObject({ title: 'Kage no Tabi', slug: 'kage-no-tabi-sub-indo' });
  });
});

describe('GET /stream/:episodeSlug', () => {
  it('mengembalikan StreamPayload lengkap', async () => {
    const res = await fetch(`${base}/stream/kage-no-tabi-episode-1`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe('Kage no Tabi Episode 1');
    expect(body.animeSlug).toBe('kage-no-tabi-sub-indo');
    expect(body.prevEpisodeSlug).toBeNull();
    expect(body.nextEpisodeSlug).toBe('kage-no-tabi-episode-2');
    expect(body.defaultPlayer).toBe('cdn-a');
    expect(Object.keys(body.streams)).toEqual(expect.arrayContaining(['720p', '480p']));
    expect(body.streams['720p'][0]).toMatchObject({ server: 'cdn-a', mode: 'native', url: expect.any(String) });
  });

  it('404 dengan {"error"} untuk episode tak dikenal', async () => {
    const res = await fetch(`${base}/stream/tidak-ada-episode-1`);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Episode tidak ditemukan' });
  });
});

describe('route tak dikenal', () => {
  it('404 JSON di dalam /api/v1', async () => {
    const res = await fetch(`${base}/zzz`);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Endpoint tidak ditemukan' });
  });
});
