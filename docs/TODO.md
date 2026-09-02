# Todo List — Eksekusi Clone Platform Streaming Anime

Pendamping: `docs/PRD.md` (spesifikasi lengkap: kontrak API §8, skema DB §9, desain §10, aturan konten §11).

## Aturan wajib untuk model eksekutor

1. Kerjakan **berurutan dari atas ke bawah**. Jangan lompat fase; task berikutnya bergantung pada sebelumnya.
2. Ikuti `docs/PRD.md` sebagai kebenaran tunggal. Kontrak API (§8) harus diikuti **persis** — nama field, tipe, dan status HTTP.
3. **Dependensi terkunci** — jangan menambah library apa pun di luar daftar ini tanpa mencatat alasannya di commit:
   - Frontend: `react`, `react-dom`, `react-router-dom@6`, `tailwindcss@3.4`, `postcss`, `autoprefixer`, `lucide-react`, `react-hot-toast`
   - Backend: `express@4`, `better-sqlite3`, `cors`, `morgan`, `helmet`, `express-rate-limit`, `zod`
   - Root: `concurrently`; testing: `vitest`
4. **Jangan menyalin apa pun dari situs referensi** (nama, logo, teks, gambar, CSS). Semua konten fixture harus **fiktif** (judul & sinopsis karangan sendiri; poster = SVG placeholder lokal; video = file contoh berlisensi bebas atau lokal).
5. Satu task = satu commit (`feat: …` / `fix: …`). Jangan centang task sebelum kriteria "Selesai jika" terpenuhi dan aplikasi masih jalan.
6. Bila bingung antara dua implementasi, pilih yang paling sederhana yang memenuhi "Selesai jika".
7. Jangan mengubah skema DB, kontrak API, atau design token tanpa memperbarui PRD di commit yang sama.
8. Setiap selesai fase, jalankan `npm run dev` dari root dan pastikan tidak ada error console.

## Fase 0 — Fondasi repo

- [ ] **T001 — Struktur repo awal**
  - Buat folder `backend/`, `frontend/`, `docs/` (sudah ada), `.gitignore` root (node_modules, dist, `backend/data/*.db`), `README.md` root satu paragraf.
  - Selesai jika: `git status` bersih setelah commit pertama.

- [ ] **T002 — Scaffold backend**
  - `backend/package.json` (type: `module`), install dependensi backend. Script: `dev` (`node --watch src/server.js`), `seed` (`node scripts/seed.js`), `test`.
  - Selesai jika: `npm install` di `backend/` sukses tanpa warning deprecated kritis.

- [ ] **T003 — Scaffold frontend**
  - `npm create vite@latest frontend -- --template react-ts`, install dependensi frontend + `react-router-dom@6 lucide-react react-hot-toast`.
  - Selesai jika: `npm run dev` frontend menampilkan halaman default Vite.

- [ ] **T004 — Tailwind + design token**
  - `tailwind.config.js` + `postcss.config.js`; di `src/index.css`: directive tailwind, import Google Font Poppins, variabel token dari PRD §10.1 (`#0f1117`, `#1a1d27`, `#e5e7eb`, aksen indigo `#6366f1`), class `.container-page`.
  - Selesai jika: class Tailwind bekerja di `App.tsx` (uji latar gelap full-screen).

- [ ] **T005 — Root runner**
  - Root `package.json` dengan `concurrently` script `dev` menjalankan backend (`:4000`) dan frontend (`:5173`, proxy `/api` → `:4000` di `vite.config.ts`).
  - Selesai jika: satu perintah `npm run dev` dari root menjalankan keduanya.

## Fase 1 — Backend + fixture (dikerjakan sebelum frontend agar frontend langsung konsumsi API nyata)

- [ ] **T006 — Entry + middleware**
  - `src/server.js`: express + `cors()` + `morgan('dev')` + `helmet()` (tambah `contentSecurityPolicy: frame-ancestors 'none'`) + `express.json()` + mount `GET /api/v1/health` → `{"status":"ok"}` + error handler terpusat yang selalu merespons `{"error": msg}`.
  - Selesai jika: `curl localhost:4000/api/v1/health` → `{"status":"ok"}`.

- [ ] **T007 — Koneksi DB + skema**
  - `src/db.js`: better-sqlite3, file `data/app.db`, pragma WAL, jalankan DDL PRD §9 persis. Export `db`.
  - Selesai jika: file `data/app.db` terbentuk berisi 3 tabel (`sqlite_master` mengecek).

- [ ] **T008 — Fixture fiktif**
  - `fixtures/anime.fixture.json`: **24 anime fiktif** (16 ongoing + 8 complete), masing-masing 3–12 episode, tiap episode 2 kualitas (`720p`, `480p`) × 2 server (`cdn-a`, `cdn-b`) `mode: "native"`, url video contoh berlisensi bebas. Judul/sinopsis wajib karangan sendiri, bukan judul anime nyata.
  - `scripts/seed.js`: baca fixture → truncate 3 tabel → insert (genres sebagai JSON string, stream_sources dengan priority). Poster: tulis 24 SVG placeholder ke `backend/public/posters/`.
  - Selesai jika: `npm run seed` lalu query SQLite menunjukkan 24 anime, jumlah episode & source sesuai fixture.

- [ ] **T009 — Serve poster + lib util**
  - `express.static('public')`. `src/lib/paginate.js` (hitung `page/pageSize/totalPages/total` + clamp page ≥ 1, limit 1–100). `src/lib/validate.js` (zod schema query `page`, `limit`, `q`).
  - Selesai jika: `GET /posters/<file>.svg` mengembalikan SVG.

- [ ] **T010 — Query layer**
  - `src/lib/query.js`: `listAnimeByStatus(status, page, limit)`, `getAnimeBySlug(slug)`, `countEpisodes(animeId)`, `listEpisodes(animeId, page, limit)`, `searchAnime(q)`, `getEpisodeBySlug(episodeSlug)` + join anime + sources, `getNeighborEpisodes(animeId, episodeNumber)` (prev/next by number). Genre di-parse dari JSON string ke array; hasil camelCase persis PRD §8.
  - Selesai jika: dipanggil dari console sementara mengembalikan bentuk field camelCase yang benar.

- [ ] **T011 — `GET /anime/ongoing` & `GET /anime/complete`**
  - `src/routes/anime.js`; validasi query; respons `Page<Anime>` PRD §8.1 (default limit 24).
  - Selesai jika: `curl ".../anime/ongoing?page=1&limit=5"` → 5 item + meta benar (`totalPages` = ceil(total/limit)).

- [ ] **T012 — `GET /anime/detail/:slug`**
  - Gabung `Anime` + `episodes` + meta episode (default 100/hal, field: `totalEpisodeCount, episodePage, episodePerPage, episodeTotalPages, episodeHasMore`). Slug tak ada → 404 `{"error":"Anime tidak ditemukan"}`.
  - Selesai jika: respons satu anime fiktif cocok 100% dengan §8.2.

- [ ] **T013 — `GET /anime/search?q=`**
  - `q` min 2 karakter (jika kurang → 400 `{"error":"q minimal 2 karakter"}`); LIKE case-insensitive pada `title`/`japanese_title`; respons §8.3 (score nullable, `posterUrl`, `status`).
  - Selesai jika: pencarian potongan judul fixture mengembalikan item yang benar.

- [ ] **T014 — `GET /stream/:episodeSlug` + ContentProvider**
  - `src/providers/index.js`: interface `{listOngoing, listComplete, getAnime, getEpisode, refreshEpisode}` + registry env `PROVIDER` (default `mock`). `src/providers/mock.js`: baca DB. `src/routes/stream.js`: respons `StreamPayload` §8.4 (`streams` map kualitas → array `{server, mode, url}`, `defaultPlayer` = server priority tertinggi kualitas 720p; prev/next dari T010; 404 `{"error":"Episode tidak ditemukan"}`). `?refresh=true` memanggil `refreshEpisode` (mock: no-op).
  - Selesai jika: `curl .../stream/<slug-episode-fixture>` mengembalikan seluruh field §8.4 dan `?refresh=true` tetap 200.

- [ ] **T015 — Rate limit + header Retry-After**
  - `express-rate-limit`: 60/menit/IP global; 20/menit untuk `/stream` & `/search` dengan `standardHeaders: true` (RateLimit-*) dan custom handler 429 `{"error":"Terlalu banyak permintaan"}` + header `Retry-After`.
  - Selesai jika: 21 permintaan cepat ke `/search` menghasilkan 429 + header Retry-After.

- [ ] **T016 — Smoke test backend (Vitest)**
  - `backend` test: hidupkan app di port ephemeral; assert bentuk `ongoing` (meta + field camelCase), `detail` (episodes + meta), `search` (min-2-karakter 400), `stream` (defaultPlayer + prev/next), 404 shape `{"error":...}`.
  - Selesai jika: `npm test` di `backend/` hijau semua.

## Fase 2 — Fondasi frontend

- [ ] **T017 — Config + types + api client**
  - `src/config/site.ts` (`name: "KageStream"`, deskripsi, `historyKey: "ks_v1_history"`, `watchedKey: "ks_v1_watched"`). `src/types.ts` (`Anime`, `Episode`, `AnimeDetail`, `StreamPayload`, `Page<T>`, `SearchItem`, `StreamSource`). `src/lib/api.ts`: base dari `import.meta.env.VITE_API_URL || "/api/v1"`, kelas `ApiError` (status, `retryAfter` dari header `Retry-After`), metode `ongoing/complete/detail/search/stream` persis kontrak §8.
  - Selesai jika: TypeScript strict lolos build tanpa `any`.

- [ ] **T018 — Router + Layout**
  - `App.tsx`: route `/`, `/ongoing`, `/complete`, `/anime/:slug`, `/watch/:episodeSlug`, `/history`, `*` (NotFound). `components/Layout.tsx` (Header + `<Outlet/>` + Footer). Footer: `© <tahun> <brand>` + tautan donasi placeholder.
  - Selesai jika: navigasi antar route tanpa reload; route tak dikenal menampilkan NotFound.

- [ ] **T019 — Header + SearchBar**
  - Header sticky: nama brand (teks), nav Ongoing/Complete/History, menu mobile (hamburger), `SearchBar` (input `type="search"` placeholder "Cari anime...", debounce 300ms, min 2 karakter, dropdown hasil: poster kecil, judul, badge status, skor; klik → `/anime/:slug`; tutup saat blur/Escape; state loading kecil).
  - Selesai jika: mengetik potongan judul fixture menampilkan dropdown live; klik hasil pindah ke detail.

- [ ] **T020 — Komponen tampilan inti**
  - `AnimeCard` (poster 2:3 lazy, judul 2 baris, badge status, skor bintang kecil), `CardGrid` (grid responsif 2→6 kolom), `SkeletonCard`, `SectionHeading` (judul + tautan opsional "Tampilkan Semua"), `Badge`, `Pagination` (prev/next + nomor, disabled di ujung), `EmptyState`, `ErrorState` (tombol "Coba Lagi").
  - Selesai jika: storybook tidak dipakai — cukup halaman dummy sementara menampilkan semua komponen dengan data statis, tanpa error console.

- [ ] **T021 — Hooks + toast + util**
  - `hooks/useAnimeList.ts` (status loading/error/data + halaman; sinkron `?page=` di URL dengan `useSearchParams`), `hooks/usePageMeta.ts` (set `document.title` + meta description; restore saat unmount), `lib/format.ts` (`formatScore`, `formatRelativeTime`). Setup `react-hot-toast` di `main.tsx`.
  - Selesai jika: `useAnimeList` dipakai halaman dummy mem-fetch `/anime/ongoing` dari backend sungguhan.

## Fase 3 — Halaman

- [ ] **T022 — Halaman Home (`/`)**
  - Baris "Lanjutkan Menonton" (horizontal scroll; hanya jika riwayat ada; kartu 16:9 + judul + "Eps X", klik → `/watch/:lastEpisodeSlug`) → seksi "Ongoing Anime" (12 kartu, heading + "Tampilkan Semua" → `/ongoing`) → seksi "Anime Tamat" (12 kartu → `/complete`). Meta: "Beranda".
  - Selesai jika: ketika localStorage riwayat kosong baris lanjutkan tidak muncul; kedua grid memuat 12 kartu dari API.

- [ ] **T023 — Halaman Ongoing (`/ongoing`)**
  - Judul "Ongoing Anime" + deskripsi "Sedang Tayang" + `CardGrid` + `Pagination`; halaman dari `?page=`.
  - Selesai jika: klik halaman 2 mengubah URL & data, tombol prev/next sesuai status ujung.

- [ ] **T024 — Halaman Complete (`/complete`)**
  - Duplikasi pola T023 untuk status complete.
  - Selesai jika: hanya anime complete yang tampil.

- [ ] **T025 — Halaman Detail (`/anime/:slug`)**
  - Poster + panel info (judul, `japaneseTitle`, skor, studio, genre `Badge`, durasi, hari rilis, `releaseDate`, badge status, synopsis) + `EpisodeList` terpaginasi 100/hal (baris: nomor, judul, tanggal; klik → `/watch/:episodeSlug`). 404 → tampil NotFound-inline. Meta: judul anime.
  - Selesai jika: seluruh field fixture tampil; navigasi halaman episode bekerja.

- [ ] **T026 — Halaman Watch (`/watch/:episodeSlug`) — struktur**
  - Fetch `stream/:episodeSlug`: `PlayerShell` (T027) di atas, judul episode + tombol prev/next episode (disabled bila null, scroll-ke-atas saat pindah), info anime ringkas (poster kecil, judul → link `/anime/:slug`, skor, studio), `EpisodeList` anime terkait (fetch `detail/:animeSlug`).
  - Selesai jika: pindah prev/next mengganti player tanpa reload penuh; episode aktif ditandai.

- [ ] **T027 — `PlayerShell` + switcher**
  - Mode `native`: `<video controls playsInline poster>` dengan `<source src=url>`; ganti sumber hanya mengganti elemen video (state `selectedServer`, `selectedQuality`; init dari `defaultPlayer`/720p). Mode `iframe`: render `<iframe sandbox="allow-scripts allow-same-origin" ...>` (fixture mock tidak memakai mode ini, tapi komponen harus mendukung). Chip switcher: kualitas (720p/480p) + server per kualitas. Error `<video onError>` → tampilkan toast + highlight sumber bermasalah agar pengguna pilih server lain (failover manual, PRD FR-05).
  - Selesai jika: ganti kualitas/server mengganti video tanpa merender ulang halaman; `onError` menampilkan toast.

- [ ] **T028 — Halaman History (`/history`)**
  - Daftar dari `lib/history.ts`: kartu (poster kecil, judul anime, "Terakhir Eps X", waktu relatif `formatRelativeTime`, tombol play → `/watch/:lastEpisodeSlug`, tombol hapus per item) + "Hapus Semua" (dengan konfirmasi sederhana). Empty state bila kosong. Meta: "Riwayat".
  - Selesai jika: menghapus item menghilang dari daftar tanpa refresh; toast konfirmasi muncul.

- [ ] **T029 — Integrasi riwayat**
  - `lib/history.ts` (READ/UPSERT/DELETE di localStorage, max 50 entri, entri = PRD FR-07; `watchedKey` set episode-slug yang sudah ditonton). `pages/Watch` menulis upsert setiap kali halaman episode dibuka.
  - Selesai jika: menonton episode lalu ke beranda → entri "Lanjutkan Menonton" muncul dengan episode terakhir yang benar.

## Fase 4 — Polish & NFR

- [ ] **T030 — Skeleton/error/empty menyeluruh**
  - Pastikan semua fetch memakai skeleton (grid kartu) / `ErrorState` retry / `EmptyState`.
  - Selesai jika: tidak ada halaman yang menampilkan grid kosong tanpa pesan saat data kosong/error.

- [ ] **T031 — Responsif penuh**
  - Audit mobile 360px: header menu mobile, grid 2 kolom, player 16:3:9 full-width, pagination wrap, dropdown search tidak melebihi viewport.
  - Selesai jika: tampil benar di 360px dan 1280px tanpa horizontal-scroll.

- [ ] **T032 — Aksesibilitas**
  - `alt` pada semua poster (nama anime), focus-visible jelas, kontras teks token ≥ AA, navigasi keyboard Pagination & SearchBar & player native controls, `aria-label` tombol ikon.
  - Selesai jika: navigasi penuh hanya dengan keyboard (Tab/Enter/Escape) di Home → Detail → Watch.

- [ ] **T033 — SEO/meta/favicon**
  - `usePageMeta` dipasang di semua halaman (judul + deskripsi unik); favicon SVG sendiri (bukan milik referensi); og:title/og:description dasar via efek di `usePageMeta`.
  - Selesai jika: ganti route → `document.title` dan meta description berubah.

- [ ] **T034 — Rate-limit UX**
  - Tangani `ApiError.retryAfter`: toast "Terlalu banyak permintaan — coba lagi dalam X detik" + disable tombol aksi selama X detik.
  - Selesai jika: memicu 429 dari backend menampilkan pesan tersebut (uji dengan loop cepat di dev).

## Fase 5 — Pengujian & penyerahan

- [ ] **T035 — Test frontend (Vitest)**
  - `lib/api.ts` (mapping field + ApiError retryAfter), `lib/history.ts` (upsert, cap 50, delete), render `AnimeCard` + `Pagination` (disabled state).
  - Selesai jika: `npm test` frontend hijau.

- [ ] **T036 — Build produksi + serve single-origin (opsional tapi dianjurkan)**
  - `npm run build` frontend; backend melayani `frontend/dist` di route non-`/api` (fallback `index.html`); env `PORT`.
  - Selesai jika: `npm run build` lalu jalankan backend → seluruh app jalan dari satu port tanpa Vite.

- [ ] **T037 — README akhir**
  - Root README: cara `npm install` + `npm run dev`, `npm run seed`, `npm test`, struktur folder, env (`PORT`, `VITE_API_URL`, `PROVIDER`), catatan §11 PRD tentang sumber konten.
  - Selesai jika: orang baru bisa menjalankan project hanya dari README.

- [ ] **T038 — QA akhir manual**
  - Jalankan checklist semua FR PRD §5 satu per satu (FR-01 … FR-12) di browser; catat hasil di commit.
  - Selesai jika: 12/12 FR lulus tanpa error console.

## Backlog (di luar MVP — JANGAN dikerjakan sebelum semua fase selesai)

- Provider nyata pengganti mock (wajib tinjau legal §11 PRD oleh operator)
- Sinkronisasi riwayat lintas perangkat (akun)
- Halaman genre/filter, SSR/SEO penuh, PWA, unduhan
- Analytics, iklan, panel admin
