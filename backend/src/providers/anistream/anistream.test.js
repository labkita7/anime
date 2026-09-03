// Contract test provider + route dengan mock upstream lokal yang menyajikan
// fixture respons asli — tanpa jaringan sungguhan.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createAniStreamProvider } from './index.js';

const fixture = (name) =>
  readFileSync(fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url)), 'utf8');

const routes = {
  '/api/v1/anime/ongoing': 'ongoing-p1.json',
  '/api/v1/anime/complete': 'complete-p1.json',
  '/api/v1/anime/detail/otome-game-mob-s2-sub-indo': 'detail-otome.json',
  '/api/v1/anime/search': 'search-otome.json',
  '/api/v1/stream/otgsmbosd-s2-episode-9-sub-indo': 'stream-episode-9.json',
  '/api/v1/health': null, // JSON dinamis
};

function serveFixture(req, res) {
  const path = req.url.split('?')[0];
  if (!(path in routes)) {
    // Path tak dikenal: 404 JSON agar tidak menggantung fetch saat test.
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route tidak ditemukan' }));
    return;
  }
  const body =
    path === '/api/v1/health' ? JSON.stringify({ status: 'ok' }) : fixture(routes[path]);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(body);
}

describe('createAniStreamProvider (mock upstream lokal)', () => {
  let upstream;
  let provider;
  let baseUrl;
  let hits;

  beforeAll(async () => {
    hits = 0;
    upstream = createServer((req, res) => {
      hits += 1;
      serveFixture(req, res);
    });
    await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${upstream.address().port}`;
    provider = createAniStreamProvider({ apiUrl: `${baseUrl}/api/v1` });
  });

  afterAll(async () => {
    await new Promise((resolve) => upstream.close(resolve));
  });

  it('listOngoing mengembalikan Page<Anime> kontrak PRD §8', async () => {
    const page = await provider.listOngoing(1);
    expect(page.page).toBe(1);
    expect(page.totalPages).toBeGreaterThan(0);
    expect(page.data).toHaveLength(20);
    expect(page.data[0]).toMatchObject({ slug: expect.any(String), status: 'ongoing', genres: expect.any(Array) });
  });

  it('listComplete memetakan status completed -> complete', async () => {
    const page = await provider.listComplete(1);
    expect(page.data.every((a) => a.status === 'complete')).toBe(true);
  });

  it('getAnime + listEpisodes: episode diurut ASC dan bisa dipotong halaman', async () => {
    const anime = await provider.getAnime('otome-game-mob-s2-sub-indo');
    expect(anime).toMatchObject({ slug: 'otome-game-mob-s2-sub-indo', studio: 'ENGI' });
    const { data, total } = await provider.listEpisodes(anime.slug, 1, 3);
    expect(total).toBeGreaterThanOrEqual(9);
    expect(data).toHaveLength(3);
    expect(data.map((e) => e.episodeNumber)).toEqual([...data].map((e) => e.episodeNumber).sort((a, b) => a - b));
    expect(data[0].episodeNumber).toBe(1);
  });

  it('searchAnime memetakan poster -> posterUrl', async () => {
    const results = await provider.searchAnime('otome');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toMatchObject({ slug: expect.any(String), posterUrl: expect.any(String) });
  });

  it('getEpisode: defaultPlayer nama server, mode iframe, enriching boolean', async () => {
    const payload = await provider.getEpisode('otgsmbosd-s2-episode-9-sub-indo');
    expect(payload.defaultPlayer).toBe('mega');
    expect(payload.enriching).toBeTypeOf('boolean');
    expect(payload.streams['720p'][0]).toMatchObject({
      server: 'mega',
      mode: 'iframe',
      url: expect.stringContaining('/play/'),
    });
    expect(payload.prevEpisodeSlug).toBe('otgsmbosd-s2-episode-8-sub-indo');
    expect(payload.nextEpisodeSlug).toBeNull();
  });

  it('getNeighbors konsisten dengan payload stream', async () => {
    const n = await provider.getNeighbors('otgsmbosd-s2-episode-9-sub-indo');
    expect(n).toEqual({ prevEpisodeSlug: 'otgsmbosd-s2-episode-8-sub-indo', nextEpisodeSlug: null });
  });

  it('cache menyerap permintaan berulang (hit kedua tidak menambah request upstream)', async () => {
    const before = hits;
    await provider.getAnime('otome-game-mob-s2-sub-indo'); // cache hit dari test sebelumnya
    await provider.getAnime('otome-game-mob-s2-sub-indo');
    expect(hits).toBe(before);
  });

  it('refreshEpisode bypass cache dan tetap mengembalikan payload', async () => {
    const before = hits;
    const payload = await provider.refreshEpisode('otgsmbosd-s2-episode-9-sub-indo');
    expect(hits).toBe(before + 1);
    expect(payload.defaultPlayer).toBe('mega');
  });

  it('checkHealth melaporkan up', async () => {
    await expect(provider.checkHealth()).resolves.toBe('up');
  });
});

describe('kontrak route dengan PROVIDER=anistream', () => {
  let upstream;
  let server;
  let base;

  beforeAll(async () => {
    upstream = createServer(serveFixture);
    await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
    vi.stubEnv('ANISTREAM_API_URL', `http://127.0.0.1:${upstream.address().port}/api/v1`);
    vi.stubEnv('PROVIDER', 'anistream');
    vi.resetModules();
    const { createApp } = await import('../../server.js');
    server = createApp().listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}/api/v1`;
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    vi.resetModules();
    await new Promise((resolve) => server.close(resolve));
    await new Promise((resolve) => upstream.close(resolve));
  });

  it('GET /stream/:slug tetap kontrak PRD §8 + enriching', async () => {
    const res = await fetch(`${base}/stream/otgsmbosd-s2-episode-9-sub-indo`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.animeSlug).toBe('otome-game-mob-s2-sub-indo');
    expect(body.defaultPlayer).toBe('mega');
    expect(body.enriching).toBeTypeOf('boolean');
    expect(body.streams['480p'][0]).toMatchObject({ server: 'mega', mode: 'iframe', url: expect.any(String) });
  });

  it('GET /anime/ongoing memakai pageSize upstream (20), abaikan limit', async () => {
    const res = await fetch(`${base}/anime/ongoing?page=1&limit=5`);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.pageSize).toBe(20);
    expect(body.data).toHaveLength(20);
  });

  it('GET /health menambah upstream: up', async () => {
    const res = await fetch(`${base}/health`);
    expect(await res.json()).toEqual({ status: 'ok', upstream: 'up' });
  });
});
