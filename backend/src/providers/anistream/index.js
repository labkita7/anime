// AniStreamProvider: adapter ke API upstream anistreambo.hazz.biz.id/api/v1.
// CORS upstream terkunci ke origin resmi, jadi SEMUA akses wajib lewat backend
// ini (lihat docs/TODO-API.md §2). Semua method async — route harus await.

import { createRemoteClient, UpstreamError } from './client.js';
import { createCache } from './cache.js';
import { mapAnime, mapEpisode, mapSearchItem, mapStreamPayload } from './mappers.js';

const LIST_TTL_MS = 60_000;
const STREAM_TTL_MS = 30_000;
const HEALTH_TTL_MS = 30_000;

export const DEFAULT_API_URL = 'https://anistreambo.hazz.biz.id/api/v1';

export function createAniStreamProvider(options = {}) {
  const apiUrl = (options.apiUrl ?? process.env.ANISTREAM_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, '');
  const remote = options.client ?? createRemoteClient(apiUrl);
  const store = options.cache ?? createCache();
  const playBaseUrl = `${apiUrl}/play`;

  async function cached(key, ttlMs, loader) {
    const hit = store.get(key);
    if (hit !== undefined) return hit;
    const value = await loader();
    store.set(key, value, ttlMs);
    return value;
  }

  const listByKind = (kind) => async (page = 1) => {
    const body = await cached(`${kind}:page=${page}`, LIST_TTL_MS, () =>
      remote.request(`/anime/${kind}`, { query: { page } })
    );
    if (!body || !Array.isArray(body.data)) {
      throw new UpstreamError('Respons upstream tidak valid');
    }
    // `limit` diabaikan: upstream memakai pageSize tetap 20 (docs/TODO-API.md §2).
    return {
      data: body.data.map(mapAnime),
      page: body.page ?? page,
      pageSize: body.pageSize ?? body.data.length,
      totalPages: body.totalPages ?? 1,
      total: body.total ?? body.data.length,
    };
  };

  async function fetchDetail(slug) {
    return cached(`detail:${slug}`, LIST_TTL_MS, () =>
      remote.request(`/anime/detail/${encodeURIComponent(slug)}`)
    );
  }

  async function loadEpisode(episodeSlug, refresh) {
    const key = `stream:${episodeSlug}`;
    if (!refresh) {
      const hit = store.get(key);
      if (hit !== undefined) return hit;
    }
    const dto = await remote.request(`/stream/${encodeURIComponent(episodeSlug)}`, refresh ? { query: { refresh: 'true' } } : {});
    if (!dto) return null;
    const payload = mapStreamPayload(dto, playBaseUrl, episodeSlug);
    store.set(key, payload, STREAM_TTL_MS);
    return payload;
  }

  return {
    listOngoing: listByKind('ongoing'),
    listComplete: listByKind('complete'),

    async getAnime(slug) {
      const dto = await fetchDetail(slug);
      return dto ? mapAnime(dto) : null;
    },

    async searchAnime(q) {
      const body = await cached(`search:${q}`, LIST_TTL_MS, () =>
        remote.request('/anime/search', { query: { q } })
      );
      return Array.isArray(body?.data) ? body.data.map(mapSearchItem) : [];
    },

    async listEpisodes(animeSlug, page = 1, limit = 100) {
      const dto = await fetchDetail(animeSlug);
      if (!dto) return { data: [], total: 0 };
      const episodes = (dto.episodes ?? []).map(mapEpisode).sort((a, b) => a.episodeNumber - b.episodeNumber);
      const start = (page - 1) * limit;
      return { data: episodes.slice(start, start + limit), total: episodes.length };
    },

    async getEpisode(episodeSlug) {
      return loadEpisode(episodeSlug, false);
    },

    async refreshEpisode(episodeSlug) {
      return loadEpisode(episodeSlug, true);
    },

    async getNeighbors(episodeSlug) {
      const payload = await loadEpisode(episodeSlug, false);
      if (!payload) return { prevEpisodeSlug: null, nextEpisodeSlug: null };
      return { prevEpisodeSlug: payload.prevEpisodeSlug, nextEpisodeSlug: payload.nextEpisodeSlug };
    },

    /** Status upstream untuk /health: 'up' | 'down', cache 30 detik. */
    async checkHealth() {
      const hit = store.get('health');
      if (hit !== undefined) return hit;
      try {
        const body = await remote.request('/health');
        store.set('health', body?.status === 'ok' ? 'up' : 'down', HEALTH_TTL_MS);
      } catch {
        store.set('health', 'down', HEALTH_TTL_MS);
      }
      return store.get('health');
    },
  };
}

export default { createAniStreamProvider, DEFAULT_API_URL };
