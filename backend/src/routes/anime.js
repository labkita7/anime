import { Router } from 'express';
import { getProvider } from '../providers/index.js';
import { listQuerySchema, detailQuerySchema, searchQuerySchema, parseQuery } from '../lib/validate.js';

const router = Router();

// Handler async: error provider (mis. upstream mati) diteruskan ke error
// handler terpusat di server.js. Express 4 tidak menangkap rejected promise.
router.get('/ongoing', async (req, res, next) => {
  try {
    const { page, limit } = parseQuery(listQuerySchema, req.query);
    res.json(await getProvider().listOngoing(page, limit));
  } catch (err) {
    next(err);
  }
});

router.get('/complete', async (req, res, next) => {
  try {
    const { page, limit } = parseQuery(listQuerySchema, req.query);
    res.json(await getProvider().listComplete(page, limit));
  } catch (err) {
    next(err);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const { q } = parseQuery(searchQuerySchema, req.query);
    const animes = await getProvider().searchAnime(q);
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
  } catch (err) {
    next(err);
  }
});

router.get('/detail/:slug', async (req, res, next) => {
  try {
    const { page, limit } = parseQuery(detailQuerySchema, req.query);
    const provider = getProvider();
    const anime = await provider.getAnime(req.params.slug);
    if (!anime) {
      return res.status(404).json({ error: 'Anime tidak ditemukan' });
    }
    const { data: episodes, total } = await provider.listEpisodes(anime.slug, page, limit);
    res.json({
      ...anime,
      episodes,
      totalEpisodeCount: total,
      episodePage: page,
      episodePerPage: limit,
      episodeTotalPages: Math.ceil(total / limit),
      episodeHasMore: page * limit < total,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
