import db from '../db.js';
import { buildPageMeta } from './paginate.js';

function mapAnime(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    japaneseTitle: row.japanese_title,
    posterUrl: row.poster_url,
    synopsis: row.synopsis,
    score: row.score,
    status: row.status,
    type: row.type,
    totalEpisodes: row.total_episodes,
    duration: row.duration,
    releaseDay: row.release_day,
    releaseDate: row.release_date,
    studio: row.studio,
    genres: JSON.parse(row.genres || '[]'),
    sortOrder: row.sort_order,
  };
}

function mapEpisode(row) {
  if (!row) return null;
  return {
    id: row.id,
    animeId: row.anime_id,
    slug: row.slug,
    title: row.title,
    episodeNumber: row.episode_number,
    releaseDate: row.release_date,
  };
}

export function listAnimeByStatus(status, page, limit) {
  const total = db
    .prepare('SELECT COUNT(*) AS c FROM animes WHERE status = ?')
    .get(status).c;
  const rows = db
    .prepare(
      'SELECT * FROM animes WHERE status = ? ORDER BY sort_order DESC, id ASC LIMIT ? OFFSET ?'
    )
    .all(status, limit, (page - 1) * limit);
  return { data: rows.map(mapAnime), ...buildPageMeta(page, limit, total) };
}

export function getAnimeBySlug(slug) {
  return mapAnime(db.prepare('SELECT * FROM animes WHERE slug = ?').get(slug));
}

export function countEpisodes(animeId) {
  return db.prepare('SELECT COUNT(*) AS c FROM episodes WHERE anime_id = ?').get(animeId).c;
}

export function listEpisodes(animeId, page, limit) {
  const total = countEpisodes(animeId);
  const rows = db
    .prepare(
      'SELECT * FROM episodes WHERE anime_id = ? ORDER BY episode_number ASC LIMIT ? OFFSET ?'
    )
    .all(animeId, limit, (page - 1) * limit);
  return { data: rows.map(mapEpisode), total };
}

export function searchAnime(q) {
  const like = `%${q}%`;
  const rows = db
    .prepare(
      "SELECT * FROM animes WHERE title LIKE ? COLLATE NOCASE OR japanese_title LIKE ? COLLATE NOCASE ORDER BY title ASC LIMIT 20"
    )
    .all(like, like);
  return rows.map(mapAnime);
}

export function getEpisodeBySlug(episodeSlug) {
  const row = db
    .prepare(
      `SELECT e.*, a.slug AS anime_slug, a.title AS anime_title, a.poster_url AS anime_poster,
              a.synopsis AS anime_synopsis, a.score AS anime_score, a.studio AS anime_studio,
              a.genres AS anime_genres, a.duration AS anime_duration, a.release_day AS anime_release_day,
              a.status AS anime_status
       FROM episodes e JOIN animes a ON a.id = e.anime_id
       WHERE e.slug = ?`
    )
    .get(episodeSlug);
  if (!row) return null;

  const sources = db
    .prepare('SELECT quality, server, mode, url, priority FROM stream_sources WHERE episode_id = ? ORDER BY priority ASC')
    .all(row.id);

  const streams = {};
  for (const s of sources) {
    (streams[s.quality] ??= []).push({ server: s.server, mode: s.mode, url: s.url });
  }

  return {
    episode: mapEpisode(row),
    anime: {
      slug: row.anime_slug,
      title: row.anime_title,
      posterUrl: row.anime_poster,
      synopsis: row.anime_synopsis,
      score: row.anime_score,
      studio: row.anime_studio,
      genres: JSON.parse(row.anime_genres || '[]'),
      duration: row.anime_duration,
      releaseDay: row.anime_release_day,
      status: row.anime_status,
    },
    streams,
  };
}

export function getNeighborEpisodes(animeId, episodeNumber) {
  const prev = db
    .prepare('SELECT slug FROM episodes WHERE anime_id = ? AND episode_number < ? ORDER BY episode_number DESC LIMIT 1')
    .get(animeId, episodeNumber);
  const next = db
    .prepare('SELECT slug FROM episodes WHERE anime_id = ? AND episode_number > ? ORDER BY episode_number ASC LIMIT 1')
    .get(animeId, episodeNumber);
  return { prevEpisodeSlug: prev?.slug ?? null, nextEpisodeSlug: next?.slug ?? null };
}
