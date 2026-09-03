// Pemetaan DTO upstream (bentuk campuran camelCase/snake_case) ke domain
// kontrak PRD §8. Fungsi murni tanpa I/O agar mudah diuji.

/**
 * Upstream memakai "completed" untuk anime tuntas; kontrak kita "complete".
 * @param {string|undefined} status
 * @returns {'ongoing'|'complete'}
 */
export function normalizeStatus(status) {
  return status === 'completed' ? 'complete' : 'ongoing';
}

/**
 * @param {import('./types.js').RemoteAnime|null} dto
 */
export function mapAnime(dto) {
  if (!dto) return null;
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    japaneseTitle: dto.japaneseTitle ?? null,
    posterUrl: dto.posterUrl ?? null,
    synopsis: dto.synopsis ?? null,
    score: dto.score ?? null,
    status: normalizeStatus(dto.status),
    type: dto.type ?? null,
    totalEpisodes: dto.totalEpisodes != null ? String(dto.totalEpisodes) : null,
    duration: dto.duration ?? null,
    releaseDay: dto.releaseDay ?? null,
    releaseDate: dto.releaseDate ?? null,
    studio: dto.studio ?? null,
    genres: Array.isArray(dto.genres) ? dto.genres : [],
    sortOrder: dto.sortOrder ?? 0,
  };
}

/**
 * @param {import('./types.js').RemoteEpisode} dto
 */
export function mapEpisode(dto) {
  return {
    id: dto.id,
    animeId: dto.animeId,
    slug: dto.slug,
    title: dto.title,
    episodeNumber: dto.episodeNumber,
    releaseDate: dto.releaseDate ?? null,
  };
}

/**
 * @param {import('./types.js').RemoteSearchItem} dto
 */
export function mapSearchItem(dto) {
  return {
    title: dto.title,
    slug: dto.slug,
    posterUrl: dto.poster ?? null,
    status: normalizeStatus(dto.status),
    score: dto.score ?? null,
  };
}

/**
 * Payload stream: snake_case -> camelCase, token -> URL /play (mode iframe).
 * defaultPlayer = nama server yang token-nya cocok dengan default_player upstream.
 * @param {import('./types.js').RemoteStreamResponse} dto
 * @param {string} playBaseUrl mis. "https://anistreambo.hazz.biz.id/api/v1/play"
 * @param {string} episodeSlug slug episode yang diminta
 */
export function mapStreamPayload(dto, playBaseUrl, episodeSlug) {
  const defaultToken = dto.default_player ?? null;
  const streams = {};
  let defaultPlayer = null;

  for (const [quality, sources] of Object.entries(dto.streams ?? {})) {
    streams[quality] = (sources ?? []).map((s) => {
      if (defaultToken && !defaultPlayer && s.token === defaultToken) {
        defaultPlayer = s.server;
      }
      return { server: s.server, mode: 'iframe', url: `${playBaseUrl}/${s.token}` };
    });
  }

  return {
    episode: {
      id: 0,
      animeId: 0,
      slug: episodeSlug,
      title: dto.title,
      episodeNumber: dto.episode_number,
      releaseDate: null,
    },
    anime: {
      slug: dto.anime_slug,
      title: dto.anime_title,
      posterUrl: dto.poster_url ?? null,
      synopsis: dto.synopsis ?? null,
      score: dto.score ?? null,
      studio: dto.studio ?? null,
      genres: Array.isArray(dto.genres) ? dto.genres : [],
      duration: dto.duration ?? null,
      releaseDay: dto.release_day ?? null,
      status: normalizeStatus(dto.status),
    },
    streams,
    defaultPlayer,
    enriching: dto.enriching ?? false,
    prevEpisodeSlug: dto.prev_episode_slug ?? null,
    nextEpisodeSlug: dto.next_episode_slug ?? null,
  };
}
