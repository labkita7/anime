import { Router } from 'express';
import { getProvider } from '../providers/index.js';
import { getNeighborEpisodes } from '../lib/query.js';
import { streamQuerySchema, parseQuery } from '../lib/validate.js';

const router = Router();

router.get('/stream/:episodeSlug', (req, res) => {
  const { refresh } = parseQuery(streamQuerySchema, req.query);
  const provider = getProvider();
  const result = refresh
    ? provider.refreshEpisode(req.params.episodeSlug)
    : provider.getEpisode(req.params.episodeSlug);

  if (!result) {
    return res.status(404).json({ error: 'Episode tidak ditemukan' });
  }

  const { episode, anime, streams } = result;
  const qualities = Object.keys(streams);
  const defaultSource =
    streams['720p']?.[0] ?? streams[qualities[0]]?.[0] ?? null;

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
    ...getNeighborEpisodes(episode.animeId, episode.episodeNumber),
    defaultPlayer: defaultSource?.server ?? null,
    streams,
  });
});

export default router;
