import * as query from '../lib/query.js';

// MockProvider membaca data dari SQLite (diisi scripts/seed.js dari fixture fiktif).
export default {
  listOngoing(page, limit) {
    return query.listAnimeByStatus('ongoing', page, limit);
  },
  listComplete(page, limit) {
    return query.listAnimeByStatus('complete', page, limit);
  },
  getAnime(slug) {
    return query.getAnimeBySlug(slug);
  },
  searchAnime(q) {
    return query.searchAnime(q);
  },
  getEpisode(episodeSlug) {
    return query.getEpisodeBySlug(episodeSlug);
  },
  refreshEpisode(episodeSlug) {
    // MockProvider: resolusi ulang sumber adalah no-op; sumber saat ini dikembalikan.
    return query.getEpisodeBySlug(episodeSlug);
  },
};
