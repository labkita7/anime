import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import animeRoutes from './routes/anime.js';
import streamRoutes from './routes/stream.js';

const api = express.Router();

api.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Limit umum; stream & search lebih ketat (header Retry-After untuk UX klien).
const generalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak permintaan' },
});

const strictLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak permintaan' },
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit?.resetTime?.getTime() ?? Date.now()) / 1000 - Date.now() / 1000);
    res.setHeader('Retry-After', Math.max(1, retryAfter));
    res.status(429).json({ error: 'Terlalu banyak permintaan' });
  },
});

api.use(generalLimiter);
api.use(['/anime/search', '/stream'], strictLimiter);
api.use('/anime', animeRoutes);
api.use('/', streamRoutes);

api.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

export function createApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'frame-ancestors': ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.static(new URL('../public', import.meta.url).pathname));

  app.use('/api/v1', api);

  // Error handler terpusat: semua error berbentuk {"error": msg}
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status ?? 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: status === 500 ? 'Kesalahan server' : err.message });
  });

  return app;
}

if (!process.env.VITEST) {
  const port = Number.parseInt(process.env.PORT ?? '4000', 10);
  createApp().listen(port, () => {
    console.log(`KageStream API berjalan di http://localhost:${port}/api/v1`);
  });
}
