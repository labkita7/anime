import { Router } from 'express';
import { getProvider } from '../providers/index.js';
import { listEpisodes } from '../lib/query.js';
import { listQuerySchema, detailQuerySchema, searchQuerySchema, parseQuery } from '../lib/validate.js';

const router = Router();

router.get('/ongoing', (req, res) => {
  const { page, limit } = parseQuery(listQuerySchema, req.query);
  res.json(getProvider().listOngoing(page, limit));
});

router.get('/complete', (req, res) => {
  const { page, limit } = parseQuery(listQuerySchema, req.query);
  res.json(getProvider().listComplete(page, limit));
});

router.get('/search', (req, res) => {
  const { q } = parseQuery(searchQuerySchema, req.query);
  const animes = getProvider().searchAnime(q);
  res.json({
    query: q,
    totalResults: animes.length,
    data: animes.map((a) => ({
      title: a.title,
      slug: a.slug,
      posterUrl: a.posterUrl,
      status: a.status,
      score: a.score,
    })),
  });
});

router.get('/detail/:slug', (req, res) => {
  const { page, limit } = parseQuery(detailQuerySchema, req.query);
  const anime = getProvider().getAnime(req.params.slug);
  if (!anime) {
    return res.status(404).json({ error: 'Anime tidak ditemukan' });
  }
  const { data: episodes, total } = listEpisodes(anime.id, page, limit);
  res.json({
    ...anime,
    episodes,
    totalEpisodeCount: total,
    episodePage: page,
    episodePerPage: limit,
    episodeTotalPages: Math.ceil(total / limit),
    episodeHasMore: page * limit < total,
  });
});

export default router;
