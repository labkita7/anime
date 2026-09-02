import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '..', 'fixtures', 'anime.fixture.json');
const posterDir = path.join(__dirname, '..', 'public', 'posters');

const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

// Video contoh berlisensi bebas (Blender Foundation, CC-BY) — dua kualitas per episode.
const SAMPLE_VIDEOS = {
  '720p': [
    { server: 'cdn-a', mode: 'native', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
    { server: 'cdn-b', mode: 'native', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  ],
  '480p': [
    { server: 'cdn-a', mode: 'native', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' },
    { server: 'cdn-b', mode: 'native', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
  ],
};

const PALETTE = [
  ['#6366f1', '#8b5cf6'], ['#0ea5e9', '#6366f1'], ['#10b981', '#0ea5e9'],
  ['#f59e0b', '#ef4444'], ['#ec4899', '#8b5cf6'], ['#14b8a6', '#10b981'],
  ['#ef4444', '#f59e0b'], ['#8b5cf6', '#ec4899'],
];

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatTanggalIndo(date) {
  return `${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}

function posterSvg(title, index) {
  const [c1, c2] = PALETTE[index % PALETTE.length];
  const words = title.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > 14) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line.trim());
  const tspans = lines
    .slice(0, 4)
    .map((l, i) => `<tspan x="150" dy="${i === 0 ? 0 : 34}">${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</tspan>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect width="300" height="450" fill="url(#g)"/>
  <text x="150" y="200" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="700" fill="#ffffff" opacity="0.95">${tspans}</text>
  <text x="150" y="410" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#ffffff" opacity="0.7">Placeholder Poster</text>
</svg>`;
}

const insertAnime = db.prepare(
  `INSERT INTO animes (slug, title, japanese_title, poster_url, synopsis, score, status, type,
                       total_episodes, duration, release_day, release_date, studio, genres, sort_order)
   VALUES (@slug, @title, @japaneseTitle, @posterUrl, @synopsis, @score, @status, @type,
           @totalEpisodes, @duration, @releaseDay, @releaseDate, @studio, @genres, @sortOrder)`
);
const insertEpisode = db.prepare(
  `INSERT INTO episodes (anime_id, slug, title, episode_number, release_date)
   VALUES (?, ?, ?, ?, ?)`
);
const insertSource = db.prepare(
  `INSERT INTO stream_sources (episode_id, quality, server, mode, url, priority)
   VALUES (?, ?, ?, ?, ?, ?)`
);

fs.mkdirSync(posterDir, { recursive: true });

const seed = db.transaction(() => {
  db.prepare('DELETE FROM stream_sources').run();
  db.prepare('DELETE FROM episodes').run();
  db.prepare('DELETE FROM animes').run();

  const base = new Date('2026-05-04T00:00:00Z'); // awal tren rilis episode (per anime digeser 3 hari)
  const total = fixture.animes.length;

  fixture.animes.forEach((a, i) => {
    const posterUrl = `/posters/${a.slug}.svg`;
    fs.writeFileSync(path.join(posterDir, `${a.slug}.svg`), posterSvg(a.title, i));

    const animeId = insertAnime.run({
      slug: a.slug,
      title: a.title,
      japaneseTitle: a.japaneseTitle,
      posterUrl,
      synopsis: a.synopsis,
      score: a.score,
      status: a.status,
      type: a.type,
      totalEpisodes: a.status === 'complete' ? String(a.episodeCount) : 'Unknown',
      duration: a.duration,
      releaseDay: a.releaseDay,
      releaseDate: a.releaseDate,
      studio: a.studio,
      genres: JSON.stringify(a.genres),
      sortOrder: total - i,
    }).lastInsertRowid;

    const animeStart = new Date(base.getTime() + i * 3 * 86_400_000);
    for (let n = 1; n <= a.episodeCount; n++) {
      const airDate = new Date(animeStart.getTime() + (n - 1) * 7 * 86_400_000);
      const epSlug = `${a.slug.replace(/-sub-indo$/, '')}-episode-${n}`;
      const epId = insertEpisode.run(
        animeId,
        epSlug,
        `${a.title} Episode ${n}`,
        n,
        formatTanggalIndo(airDate)
      ).lastInsertRowid;

      for (const [quality, sources] of Object.entries(SAMPLE_VIDEOS)) {
        for (const s of sources) {
          insertSource.run(epId, quality, s.server, s.mode, s.url, quality === '720p' ? 10 : 5);
        }
      }
    }
  });
});

seed();
const counts = {
  animes: db.prepare('SELECT COUNT(*) c FROM animes').get().c,
  episodes: db.prepare('SELECT COUNT(*) c FROM episodes').get().c,
  sources: db.prepare('SELECT COUNT(*) c FROM stream_sources').get().c,
};
console.log('Seed selesai:', counts);
