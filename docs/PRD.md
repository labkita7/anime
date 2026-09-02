# PRD — Platform Streaming Anime (Klon Fungsional AniStream)

| | |
|---|---|
| Status | Draft v1.0 |
| Tanggal | 2026-09-02 |
| Referensi | https://anistream.hazz.biz.id/ (hasil reverse engineering, lihat §2) |
| Dokumen pendamping | `docs/TODO.md` — daftar tugas granular untuk model AI eksekutor berbiaya rendah |
| Brand placeholder | **KageStream** — wajib pakai branding sendiri; jangan menyalin nama/logo/aset/teks AniStream |

---

## 1. Ringkasan Eksekutif

Membangun ulang (clone fungsional, bukan salinan piksel) platform streaming anime bertipe AniStream: katalog anime subtitle Indonesia dengan halaman beranda, daftar ongoing/complete, detail anime, halaman tonton dengan player multi-server + multi-kualitas, pencarian, riwayat tontonan, dan "lanjutkan menonton" — semuanya tersimpan lokal di perangkat pengguna.

Arsitektur referensi adalah **frontend SPA + backend API terpisah**. Klon mengikuti pola yang sama dengan stack yang lebih umum (React/Vite + Express/SQLite) agar dapat dikerjakan model AI murah dengan tingkat keberhasilan tinggi. Seluruh build menggunakan **data fixture fiktif** melalui abstraction `ContentProvider` (lihat §11).

## 2. Hasil Reverse Engineering Situs Referensi

### 2.1 Stack & infrastruktur

| Aspek | Temuan |
|---|---|
| Frontend | SvelteKit (Svelte 5, data dimuat di sisi klien; SSR hanya shell), di belakang Cloudflare |
| Styling | Tailwind CSS, tema gelap, font Google **Poppins** (400–800) |
| Ikon / animasi / toast | lucide; GSAP; toast pojok kanan-atas |
| Analytics | Google Analytics `G-MXYWW7EN8H` |
| Backend | API terpisah: `https://anistreambo.hazz.biz.id/api/v1` (di-inject via env `PUBLIC_API_URL`) |
| Header keamanan | `CSP: frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, HSTS, `X-Frame-Options: DENY` |
| Footer | "© 2026 AniStream." + tautan donasi "Dukung via Kreate" |

### 2.2 Route frontend (dari manifest app.js)

| Route | Fungsi |
|---|---|
| `/` | Beranda: baris **Lanjutkan Menonton** (dari riwayat lokal) + grid **Ongoing Anime** + grid **Anime Tamat**, masing-masing dengan tautan "Tampilkan Semua" |
| `/ongoing` | Grid anime berstatus ongoing + paginasi |
| `/complete` | Grid anime tamat + paginasi |
| `/history` | Riwayat tontonan (disimpan klien, bukan server) |
| `/anime/[slug]` | Detail anime + daftar episode (tidak muncul di nav) |
| `/watch/[episodeSlug]` | Player + info anime + navigasi episode prev/next + switcher server/kualitas |

Kartu katalog → `/anime/{slug}`; kartu "Lanjutkan Menonton" → `/watch/{last_episode_slug}`.

### 2.3 Kontrak API referensi (diekstrak dari bundle JS)

Base: `PUBLIC_API_URL` (`/api/v1`). Klien punya kelas `ApiError` yang membaca header `Retry-After` (sadar rate-limit). Semua error berbentuk JSON `{"error": "..."}`.

| Endpoint | Parameter | Bentuk respons |
|---|---|---|
| `GET /anime/ongoing` | `page`, `limit` | `{data: Anime[], page, pageSize, totalPages, total}` |
| `GET /anime/complete` | `page`, `limit` | sama |
| `GET /anime/detail/{slug}` | `page`, `limit` (episode, default 100/hal) | `Anime` + `episodes: Episode[]` + meta `total_episodes`, `episodes_page`, `episodes_per_page`, `episodes_total_pages`, `episodes_has_more` |
| `GET /anime/search` | `q` | `{query, total_results, data: [{title, slug, poster, status, score}]}` |
| `GET /stream/{episodeSlug}` | `?refresh=true` (resolusi ulang sumber) | muatan tontonan, lihat §2.4 |

### 2.4 Model data (field yang teramati)

**Anime**: `id, slug, title, japaneseTitle, posterUrl, synopsis, score (string), status ('ongoing'/'complete'), type, totalEpisodes, duration, releaseDay, releaseDate, studio, genres[], sortOrder, sourceUrl, lastSyncedAt, createdAt, updatedAt`

**Episode**: `id, animeId, slug, title, episodeNumber, releaseDate`

**Muatan stream** (snake_case di referensi): `title, anime_slug, anime_title, poster_url, episode_number, synopsis, score, studio, genres[], duration, release_day, status, prev_episode_slug, next_episode_slug, default_player, streams` — `streams` adalah map kualitas (`"720p"`, `"480p"`) → array `{server, token}`.

**Perilaku penting**: paginasi server-side; episode pada halaman detail terpaginasi 100/hal; navigasi prev/next episode via slug; `?refresh=true` memicu resolusi ulang sumber (failover multi-server); state "sedang menonton" disimpan di `localStorage` (`anistream_history`, `anistream_watched_episodes`).

**Sumber konten referensi**: metadata & poster di-scrape dari situs pihak ketiga (field `sourceUrl`/`posterUrl` menunjuk ke agregator tanpa lisensi yang tampak), video di-embed dari beberapa file-host pihak ketiga. Lihat §11 untuk posisi klon terhadap hal ini.

## 3. Tujuan & Scope

### 3.1 Tujuan
1. Klon fungsional seluruh alur inti: jelajah → cari → detail → tonton → lanjutkan.
2. Arsitektur frontend + API terpisah yang dapat di-deploy independen.
3. Kode sederhana & deterministik yang bisa dikerjakan model AI murah per task.

### 3.2 In scope (MVP)
- 6 route sesuai §2.2, pencarian di header (dropdown hasil, debounce), player dengan switcher kualitas & server, riwayat + lanjutkan menonton via `localStorage`, paginasi, skeleton/empty/error state, tema gelap responsif, meta SEO dasar, backend API lengkap sesuai §8 dengan data fixture.

### 3.3 Out of scope (MVP)
- Akun pengguna / autentikasi / sinkronisasi riwayat lintas perangkat.
- SSR/SEO penuh (referensi juga memuat data di klien).
- Unduhan, komentar, notifikasi, PWA, subtitle upload.
- Penarik (scraper) sumber eksternal mana pun — hanya `ContentProvider` + `MockProvider` (§11).

## 4. Pengguna & User Stories

Pengguna tunggal: penonton anime di Indonesia (mobile-first, koneksi menengah).

1. Sebagai penonton, saya membuka beranda dan melihat anime ongoing & tamat terbaru agar cepat memilih.
2. Saya mencari judul dari header dan langsung menuju halaman detailnya.
3. Di halaman detail saya membaca sinopsis/skor/studio/genre lalu memilih episode.
4. Saat menonton, jika satu server bermasalah saya pindah server/kualitas tanpa keluar dari halaman.
5. Saya menutup tab; kembali lagi, beranda menampilkan "Lanjutkan Menonton" tepat di episode terakhir.
6. Saya membuka History untuk melihat/menghapus jejak tontonan.

## 5. Kebutuhan Fungsional

Setiap FR punya kriteria terima; eksekutor tidak boleh menandai task selesai sebelum kriteria terpenuhi.

| ID | Kebutuhan | Kriteria terima |
|---|---|---|
| FR-01 | Beranda menampilkan 3 seksi: Lanjutkan Menonton (jika ada riwayat), Ongoing (12 kartu), Complete (12 kartu) + tautan "Tampilkan Semua" ke `/ongoing` `/complete` | Grid render dari API; seksi lanjutkan muncul hanya bila riwayat ada |
| FR-02 | `/ongoing` & `/complete`: grid + paginasi server-side (`?page=`) | Ganti halaman memperbarui URL & data; tombol prev/next disabled di ujung |
| FR-03 | `/anime/:slug`: poster + seluruh field anime (skor, studio, genre, durasi, hari & tanggal rilis, synopsis) + daftar episode terpaginasi 100/hal | Data dari `detail/:slug`; klik episode → `/watch/:episodeSlug` |
| FR-04 | `/watch/:episodeSlug`: player, judul episode, tombol prev/next episode, info anime ringkas, daftar episode lain | Navigasi prev/next sesuai `prev/nextEpisodeSlug`; halaman tetap scroll ke atas saat pindah episode |
| FR-05 | Player mendukung banyak kualitas & banyak server per kualitas; sumber default dari `defaultPlayer` | Pindah server/kualitas tidak me-reload seluruh halaman; sumber gagal → pengguna bisa memilih sumber lain |
| FR-06 | Pencarian di header: debounce 300ms, minimal 2 karakter, hasil dropdown (poster, judul, status, skor) | Klik hasil → `/anime/:slug`; Enter → halaman hasil |
| FR-07 | Riwayat: setiap menonton dicatat `{animeSlug, animeTitle, posterUrl, lastEpisodeSlug, lastEpisodeNumber, watchedAt}` di `localStorage` | Riwayat max 50 entri, terbaru dulu; halaman History bisa hapus per item & hapus semua |
| FR-08 | Lanjutkan Menonton: entri riwayat terbaru per anime, klik → `/watch/:lastEpisodeSlug` | Baris muncul di beranda hanya jika riwayat tidak kosong |
| FR-09 | Loading skeleton untuk semua fetch; empty state untuk data kosong; error state dengan tombol coba lagi | Tidak ada flash konten kosong saat loading |
| FR-10 | Toast untuk aksi (mis. menghapus riwayat) dan error API | Toast muncul pojok kanan atas, auto-dismiss |
| FR-11 | Rate-limit `Retry-After` dari API ditampilkan ("coba lagi dalam X detik") | `ApiError.retryAfter` terbaca dari header |
| FR-12 | Meta dasar: `document.title` + meta description unik per halaman, favicon sendiri | Setiap route mengubah title/description |

## 6. Kebutuhan Non-Fungsional

- **Performa**: interaktif < 2s koneksi cepat; bundle JS frontend < 200KB gzip (di luar player); gambar poster `loading="lazy"`.
- **Responsif**: mobile-first; grid 2 kolom di ponsel → 5–6 kolom di desktop; header punya menu mobile.
- **Aksesibilitas**: semua poster punya `alt`; navigasi keyboard (focus-visible); kontras teks ≥ WCAG AA; kontrol `<video>` native.
- **Keamanan**: header `X-Content-Type-Options`, `X-Frame-Options: DENY`, `CSP frame-ancestors 'none'` di backend; validasi input query dengan zod; rate limit 60 req/menit/IP umum, 20/menit untuk `/stream` & `/search` dengan header `Retry-After`.
- **Kualitas kode**: TypeScript strict di frontend; tanpa `any` di modul bersama; commit per task.
- **Portabilitas**: backend & frontend masing-masing bisa jalan sendiri via `npm run dev`; env: `PORT`, `VITE_API_URL`.

## 7. Arsitektur Solusi

### 7.1 Stack (dipilih untuk model eksekutor murah — paling umum di data latih)

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend | Vite + React 18 + TypeScript + Tailwind CSS 3.4 + react-router-dom 6 + lucide-react + react-hot-toast | Konvensi paling dikenal; referensi juga memuat data di klien sehingga SPA cukup |
| Backend | Node.js (ESM, JavaScript polos) + Express 4 + better-sqlite3 + zod + cors + morgan + helmet + express-rate-limit | Tanpa build step, tanpa ORM — paling sedikit titik gagal |
| DB | SQLite (file `data/app.db`, mode WAL) | Nol konfigurasi, mudah di-reset |

### 7.2 Struktur repo

```
├── backend/
│   ├── package.json
│   ├── data/                    # app.db (gitignored)
│   ├── scripts/seed.js          # isi fixture fiktif
│   ├── src/
│   │   ├── server.js            # entry + middleware
│   │   ├── db.js                # koneksi + skema DDL
│   │   ├── routes/anime.js      # ongoing/complete/detail/search
│   │   ├── routes/stream.js     # stream/:episodeSlug
│   │   ├── providers/index.js   # ContentProvider + registry
│   │   ├── providers/mock.js    # MockProvider (fixture fiktif)
│   │   └── lib/{query,paginate,validate}.js
│   └── fixtures/anime.fixture.json
├── frontend/
│   ├── package.json  vite.config.ts  tailwind.config.js
│   └── src/
│       ├── config/site.ts        # brand, deskripsi, key localStorage
│       ├── types.ts              # Anime, Episode, StreamPayload, Page<T>
│       ├── lib/{api,history,format}.ts
│       ├── hooks/{useAnimeList,usePageMeta}.ts
│       ├── components/           # lihat §10.3
│       └── pages/                # Home, Ongoing, Complete, AnimeDetail, Watch, History, NotFound
├── docs/PRD.md  docs/TODO.md
└── package.json                  # concurrently: jalankan dua dev server
```

### 7.3 Alur data

`Halaman → hook → apiClient (fetch, ApiError + Retry-After) → GET /api/v1/... → route → query SQLite → respons {data, page,...}`. Riwayat tontonan tidak lewat server: `pages/Watch` menulis ke `lib/history.ts` (localStorage), beranda & History membacanya.

## 8. Spesifikasi API Klon (kontrak final — WAJIB diikuti persis)

Standarisasi: semua respons **camelCase** (referensi tidak konsisten: list camelCase, stream snake_case). Error selalu `{"error": string}` + status HTTP tepat.

| Endpoint | Request | Respons |
|---|---|---|
| `GET /api/v1/health` | — | `{"status":"ok"}` |
| `GET /api/v1/anime/ongoing` | `page` (default 1), `limit` (default 24) | `Page<Anime>` §8.1 |
| `GET /api/v1/anime/complete` | sama | `Page<Anime>` |
| `GET /api/v1/anime/detail/:slug` | `page`, `limit` (default 100) | `AnimeDetail` §8.2; 404 bila slug tak ada |
| `GET /api/v1/anime/search` | `q` (min 2 karakter, max 100) | `{"query","totalResults","data":[SearchItem]}` §8.3; 400 bila q invalid |
| `GET /api/v1/stream/:episodeSlug` | `refresh` (boolean) | `StreamPayload` §8.4; 404 bila episode tak ada |

### 8.1 `Page<Anime>`
```json
{
  "data": [{
    "id": 1, "slug": "kage-no-tabi-sub-indo", "title": "Kage no Tabi",
    "japaneseTitle": "影の旅", "posterUrl": "/posters/kage-no-tabi.svg",
    "synopsis": "Fiktif: seorang pemburu bayangan …", "score": "8.10",
    "status": "ongoing", "type": "TV", "totalEpisodes": "12",
    "duration": "24 min. per ep.", "releaseDay": "Sabtu", "releaseDate": "05 Sep",
    "studio": "Studio Fiktif A", "genres": ["Action", "Fantasy"], "sortOrder": 1
  }],
  "page": 1, "pageSize": 24, "totalPages": 1, "total": 1
}
```

### 8.2 `AnimeDetail`
Semua field `Anime` plus: `"episodes": [{"id":1,"animeId":1,"slug":"kage-no-tabi-episode-1","title":"Kage no Tabi Episode 1","episodeNumber":1,"releaseDate":"5 September 2026"}]`, dan meta `totalEpisodeCount`, `episodePage`, `episodePerPage`, `episodeTotalPages`, `episodeHasMore`.

### 8.3 `SearchItem`
`{"title","slug","posterUrl","status","score"}` (score bisa `null`).

### 8.4 `StreamPayload`
```json
{
  "title": "Kage no Tabi Episode 1",
  "animeSlug": "kage-no-tabi-sub-indo", "animeTitle": "Kage no Tabi",
  "posterUrl": "/posters/kage-no-tabi.svg", "episodeNumber": 1,
  "synopsis": "…", "score": "8.10", "studio": "Studio Fiktif A",
  "genres": ["Action"], "duration": "24 min. per ep.",
  "releaseDay": "Sabtu", "status": "ongoing",
  "prevEpisodeSlug": null, "nextEpisodeSlug": "kage-no-tabi-episode-2",
  "defaultPlayer": "cdn-a",
  "streams": {
    "720p": [{ "server": "cdn-a", "mode": "native", "url": "https://contoh/video-720.mp4" }],
    "480p": [{ "server": "cdn-b", "mode": "native", "url": "https://contoh/video-480.mp4" }]
  }
}
```
`mode`: `"native"` (URL file video untuk `<video>`) atau `"iframe"` (URL embed untuk iframe ber-sandbox). `defaultPlayer` = nama server sumber aktif. `?refresh=true` memicu provider resolve ulang sumber episode (untuk failover).

## 9. Skema Database (SQLite DDL)

```sql
CREATE TABLE IF NOT EXISTS animes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  japanese_title TEXT,
  poster_url TEXT,
  synopsis TEXT,
  score TEXT,
  status TEXT NOT NULL CHECK (status IN ('ongoing','complete')),
  type TEXT,
  total_episodes TEXT,
  duration TEXT,
  release_day TEXT,
  release_date TEXT,
  studio TEXT,
  genres TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_animes_status_sort ON animes(status, sort_order);

CREATE TABLE IF NOT EXISTS episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anime_id INTEGER NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  episode_number INTEGER NOT NULL,
  release_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_episodes_anime ON episodes(anime_id, episode_number);

CREATE TABLE IF NOT EXISTS stream_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  episode_id INTEGER NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  quality TEXT NOT NULL,
  server TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'native',
  url TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sources_episode ON stream_sources(episode_id, priority);
```

## 10. Desain UI

### 10.1 Design token (tema gelap)
Latar `#0f1117`, permukaan kartu `#1a1d27`, teks utama `#e5e7eb`, aksen utama bebas (contoh indigo `#6366f1`), badge ongoing = aksen, badge complete = hijau, radius kartu 0.5rem, font Poppins (400/500/600/700/800). Poster rasio 2:3, `object-fit: cover`.

### 10.2 Wireframe teks
- **Beranda**: header sticky → baris horizontal-scroll "Lanjutkan Menonton" (kartu lebar 16:9 kecil: thumbnail, judul, "Eps X") → "Ongoing Anime" (judul seksi + "Tampilkan Semua") grid poster → "Anime Tamat" sama → footer.
- **Ongoing/Complete**: judul + deskripsi singkat → grid → paginasi bawah.
- **Detail**: poster kiri (atas di mobile), info kanan (judul, judul Jepang, skor, studio, genre badge, durasi, hari rilis, status badge, synopsis) → daftar episode (baris: nomor, judul, tanggal; tombol halaman bila > 1 hal).
- **Watch**: player 16:9 → judul episode + tombol prev/next → switcher kualitas & server (chip) → info anime ringkas → daftar episode lain.
- **History**: daftar kartu (poster kecil, judul anime, "terakhir Eps X", waktu relatif) + hapus per item + "Hapus Semua".
- **NotFound**: teks 404 + tombol ke beranda.

### 10.3 Komponen inti
`AnimeCard`, `CardGrid`, `SkeletonCard`, `EmptyState`, `ErrorState` (dengan tombol coba lagi), `Pagination`, `SearchBar` (+ `SearchResultItem`), `Badge`, `EpisodeList` (+ `EpisodeRow`), `PlayerShell` (+ `ServerQualitySwitcher`), `SectionHeading`, `Toaster` (react-hot-toast), `Layout` (Header/Footer/Outlet).

## 11. Strategi Konten & Catatan Hukum

1. Situs referensi mengambil metadata, poster, dan tautan video dari sumber pihak ketiga tanpa lisensi yang tampak (field `sourceUrl`/`posterUrl` menunjuk agregator; video dari file-host umum). **Klon yang dibangun dokumen ini adalah perangkat lunak netral** dan seluruh tugas build memakai fixture fiktif.
2. Arsitektur penyediaan konten memakai interface `ContentProvider`:
   ```js
   // backend/src/providers/index.js
   module.exports = {
     listOngoing(), listComplete(), getAnime(slug), getEpisode(episodeSlug), refreshEpisode(episodeSlug)
   };
   ```
   `MockProvider` (satu-satunya implementasi di scope ini) membaca `fixtures/anime.fixture.json` ke SQLite. `?refresh=true` pada `/stream` memanggil `refreshEpisode` (untuk MockProvider: no-op yang mengembalikan sumber saat ini).
3. Poster fixture: SVG lokal bergaya placeholder (warna + judul), disajikan backend di `/posters/:file` — jangan pakai gambar pihak ketiga.
4. Video fixture: gunakan video contoh berlisensi bebas atau file lokal kecil; `mode: "native"`.
5. Keputusan menghubungkan `ContentProvider` ke sumber eksternal mana pun — dan legalitasnya — berada di luar scope dokumen ini dan menjadi tanggung jawab penuh operator; menghubungkannya ke sumber tanpa lisensi dapat melanggar hak cipta.

## 12. Metrik Sukses
- Semua FR (§5) lulus verifikasi manual; 0 error console di semua route.
- `npm run build` frontend sukses tanpa error TypeScript; semua test Vitest hijau.
- Lighthouse (mobile): Performance ≥ 85, Accessibility ≥ 90.
- Backend: seluruh endpoint mengembalikan bentuk persis §8 (diverifikasi test kontrak).

## 13. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Model eksekutor menyimpang / halusinasi API | Task granular + kontrak §8 eksplisit + daftar dependensi terkunci di `TODO.md` + test kontrak |
| Scope creep | Daftar out-of-scope §3.3; setiap penambahan fitur ditolak di review task |
| Iframe pihak ketiga tidak aman/di-block | Mode `native` adalah default mock; mode `iframe` wajib `sandbox` + CSP |
| Riwayat localStorage penuh/bentrok antar-versi | Kap 50 entri + versi key (`ks_v1_*`) di `config/site.ts` |
| Kualitas visual tidak konsisten | Design token §10.1 + komponen terpusat §10.3 |
