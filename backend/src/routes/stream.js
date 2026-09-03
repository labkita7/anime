import { Router } from 'express';
import { getProvider } from '../providers/index.js';
import { streamQuerySchema, parseQuery } from '../lib/validate.js';

const router = Router();

router.get('/stream/:episodeSlug', async (req, res, next) => {
  try {
    const { refresh } = parseQuery(streamQuerySchema, req.query);
    const provider = getProvider();
    const result = refresh
      ? await provider.refreshEpisode(req.params.episodeSlug)
      : await provider.getEpisode(req.params.episodeSlug);

    if (!result) {
      return res.status(404).json({ error: 'Episode tidak ditemukan' });
    }

    const { episode, anime, streams } = result;
    const qualities = Object.keys(streams);
    // Provider remote melaporkan server default dari token upstream;
    // mock tidak, jadi jatuh ke sumber pertama 720p seperti sebelumnya.
    const defaultSource = streams['720p']?.[0] ?? streams[qualities[0]]?.[0] ?? null;
    const neighbors = (await provider.getNeighbors(req.params.episodeSlug)) ?? {
      prevEpisodeSlug: null,
      nextEpisodeSlug: null,
    };

    res.json({
      title: episode.title,
      animeSlug: anime.slug,
      animeTitle: anime.title,
      posterUrl: anime.posterUrl,
      episodeNumber: episode.episodeNumber,
      synopsis: anime.synopsis,
      score: anime.score,
      studio: anime.studio,
      genres: anime.genres,
      duration: anime.duration,
      releaseDay: anime.releaseDay,
      status: anime.status,
      ...neighbors,
      defaultPlayer: result.defaultPlayer ?? defaultSource?.server ?? null,
      streams,
      enriching: result.enriching ?? false,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
