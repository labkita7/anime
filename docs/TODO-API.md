# TODO-API — Integrasi Provider AniStream Asli

Status: **SIAP DIKERJAKAN** (analisis selesai 2026-09-02, semua temuan diverifikasi langsung ke API live)
Prasyarat: MVP KageStream (T001–T038) sudah ada di repo. Dokumen ini tidak menggantikan `docs/TODO.md`, melainkan menambah fase baru.
Cara pakai: kerjakan berurutan T101 → T123. Satu task = satu commit. Jangan lompat fase.

---

## 1. Temuan reverse engineering API `https://anistreambo.hazz.biz.id/api/v1`

Semua temuan di bawah diverifikasi dengan request langsung + browser sungguhan pada 2026-09-02.

### 1.1 Daftar route

| Route remote | Bentuk respons | Catatan |
|---|---|---|
| `GET /health` | `{"status":"ok"}` | Tanpa autentikasi |
| `GET /anime/ongoing?page=N` | `{ data, page, pageSize, totalPages, total }` | pageSize tetap 20; saat dicek: total 76, 4 halaman |
| `GET /anime/complete?page=N` | sama | saat dicek: total 25, 2 halaman |
| `GET /anime/detail/:slug` | objek anime + `episodes[]` | episode terbaru lebih dulu (DESC) |
| `GET /anime/search?q=...` | `{ query, total_results, data }` | item: `{title, slug, poster, status, score}` — TANPA paginasi (`?page` diabaikan), hanya subset ±12 dari `total_results` |
| `GET /stream/:episodeSlug` | payload snake_case (§1.3) | mendukung `?refresh=true` (memicu sinkronisasi ulang, `enriching:true`) |
| `GET /play/:token` | `text/html` | halaman embed file-host (mega = halaman MEGA asli; vidhide = halaman embed vidhide). Dipakai langsung sebagai `src` iframe. |

### 1.2 Bentuk item list/detail (camelCase)

```json
{
  "id": 59, "slug": "otome-game-mob-s2-sub-indo",
  "title": "Otome Game Sekai wa Mob ni Kibishii Sekai desu S2",
  "japaneseTitle": "乙女ゲー世界はモブに厳しい世界です2",
  "posterUrl": "https://otakudesu.blog/wp-content/uploads/2026/07/158337.jpg",
  "synopsis": "", "score": "6.81", "status": "ongoing",
  "type": "TV", "totalEpisodes": "12", "duration": "23 min. per ep.",
  "releaseDay": "Kamis", "releaseDate": "03 Sep", "studio": "ENGI",
  "genres": ["Fantasy", "Harem"], "sortOrder": 1,
  "sourceUrl": "https://otakudesu.blog/anime/...", "lastSyncedAt": "..."
}
```

`episodes[]` di detail: `{ id, animeId, slug, title, episodeNumber, releaseDate, sourceUrl, lastSyncedAt, createdAt, updatedAt }` — slug episode berpola `{kode}-episode-{N}-sub-indo` (contoh: `otgsmbosd-s2-episode-9-sub-indo`).

Catatan tipe: `score`, `totalEpisodes`, `duration` dikirim sebagai **string** (bisa `null`); `genres` bisa `null`.

### 1.3 Bentuk respons stream (snake_case)

```json
{
  "title": "... Episode 9 Subtitle Indonesia",
  "anime_slug": "...", "anime_title": "...", "poster_url": "...",
  "episode_number": 9, "synopsis": "", "score": "6.81", "studio": "ENGI",
  "genres": [...], "duration": "23 min. per ep.", "release_day": "Kamis",
  "status": "ongoing",
  "prev_episode_slug": "...", "next_episode_slug": null,
  "default_player": "b86c804f-36c1-49b0-9b9a-f5211c0875b1",
  "streams": {
    "720p": [ { "server": "mega", "token": "..." }, { "server": "vidhide", "token": "..." } ],
    "480p": [ ... ], "360p": [ ... ]
  },
  "enriching": false
}
```

Cara mainnya (diamati dari halaman watch asli): iframe `src = {API_URL}/play/{token}`; `default_player` adalah token sumber default; urutan kualitas 720p→480p→360p.

### 1.4 Kendala & fakta penting

1. **CORS terkunci**: `Access-Control-Allow-Origin` hanya untuk origin `https://anistream.hazz.biz.id`. Request dari origin lain (termasuk localhost kita) TIDAK diizinkan → frontend KageStream **wajib** mengakses lewat proxy backend sendiri.
2. **Poster otakudesu bisa di-`<img>` langsung dari browser** (situs asli melakukannya), tetapi **fetch server-side diblokir 403** (kemungkinan WAF berbasis fingerprint TLS). Jadi jangan proxy gambar dari backend tanpa riset tambahan; cukup hotlink + fallback placeholder.
3. **`/play/:token` tidak mengirim `X-Frame-Options` dan `ACAO: *`** → aman di-iframe dari origin mana pun.
4. **Rate limit remote tidak teramati** (burst 40× `/stream` semuanya 200, tanpa header limit). Rate limit milik backend kita tetap dipertahankan.
5. **`enriching: true`** berarti sinkronisasi ulang sedang berjalan — data stream bisa belum lengkap saat itu.
6. Halaman `/play` vidhide menyertakan pihak ketiga (googletagmanager, yandex, pixibay) — iklan/tracker di dalam iframe, di luar kendali kita.

### 1.5 Hal yang belum diketahui (risiko)

- **Umur token `/play`**: belum diketahui apakah token bertahan berhari-hari atau dirotasi. Verifikasi di T121.
- **Ketersediaan remote**: `anistreambo.hazz.biz.id` adalah layanan pihak ketiga — bisa berubah URL, mati, atau menutup akses kapan pun tanpa pemberitahuan.
- Konten yang dilayani API ini **tidak berlisensi** (scrape otakudesu + file-host mega/vidhide). Lihat §5.

---

## 2. Keputusan arsitektur

1. **Adapter di backend, frontend tidak berubah URL.** Frontend tetap memanggil `/api/v1` milik kita (kontrak PRD §8). `AniStreamProvider` mengambil dari API remote, memetakan bentuk respons ke kontrak kita, dan mengembalikannya. Ini dipaksa oleh kendala CORS (§1.4 poin 1) sekaligus menjaga frontend tetap provider-agnostic.
2. **`PROVIDER=mock` tetap default.** Provider `anistream` opt-in via env. Test dan dev tetap stabil tanpa jaringan.
3. **Interface provider diperluas.** Saat ini route detail/stream mengambil episodes & tetangga episode langsung dari SQLite (`listEpisodes`, `getNeighborEpisodes` di `lib/query.js`) — itu harus pindah ke provider agar bisa diganti remote.
4. **Pemetaan kunci** (remote → kontrak kita):
   - `status: "completed"` → `"complete"` (tipe frontend `'ongoing' | 'complete'`).
   - search: `poster` → `posterUrl`, `total_results` → dihitung ulang oleh route kita.
   - stream: snake_case → camelCase; `streams[q][{server, token}]` → `{ server, mode: "iframe", url: "{API_URL}/play/{token}" }`; `default_player` (token) → nama `server` sumber yang token-nya cocok.
   - `prev_episode_slug`/`next_episode_slug` → `prevEpisodeSlug`/`nextEpisodeSlug`.
   - `enriching` diteruskan sebagai field baru `enriching` (boolean) di respons stream kita.
5. **`limit` diabaikan pada provider anistream** (remote pageSize tetap 20); respons tetap memakai bentuk `Page` kita dengan `pageSize` dilaporkan sesuai remote. UI paginasi sudah membaca `totalPages` sehingga tetap benar.
6. **Cache in-memory ber-TTL** di backend untuk menahan beban ke remote dan mempercepat respons.

---

## 3. Task list

Format sama dengan `docs/TODO.md`: setiap task punya berkas acuan dan kriteria selesai. ID task T101–T123.

### Fase A — Fondasi adapter

- **T101 — Definisi tipe DTO remote.**
  Berkas: `backend/src/providers/anistream/types.js` (JSDoc). Definisikan bentuk `RemoteListResponse`, `RemoteAnime`, `RemoteEpisode`, `RemoteSearchResponse`, `RemoteSearchItem`, `RemoteStreamResponse` persis §1.2–1.3 (ingat: `score`/`totalEpisodes`/`duration` string-atau-null, `genres` bisa null, `episodes` DESC).
  Selesai jika: tipe terdokumentasi + setiap field null-able ditandai.

- **T102 — `RemoteApiClient`: fetch + timeout + pemetaan error.**
  Berkas: `backend/src/providers/anistream/client.js`. Fungsi `request(path, { query, timeoutMs = 8000 })` memakai `fetch` global + `AbortSignal.timeout`. Map error: remote 404 → `null`/sinyal not-found; remote 5xx/timeout/jaringan → `Error` dengan `.statusCode = 502` dan pesan Indonesia (mis. "Sumber upstream tidak tersedia"). Set header `User-Agent` mirip browser.
  Selesai jika: unit test dengan mock `fetch` (globalThis) menutupi 200, 404, 500, timeout.

- **T103 — Env & konfigurasi provider.**
  Berkas: `backend/src/providers/index.js`, `backend/src/lib/config.js` (baru bila perlu). Env: `ANISTREAM_API_URL` (default `https://anistreambo.hazz.biz.id/api/v1`), `PROVIDER` (`mock`|`anistream`, default `mock`). Validasi nilai `PROVIDER` tak dikenal → fallback `mock` + `console.warn`.
  Selesai jika: `getProvider('anistream')` mengembalikan provider anistream, `getProvider('tidakada')` fallback mock tanpa throw.

- **T104 — Util pemetaan DTO → domain.**
  Berkas: `backend/src/providers/anistream/mappers.js`. Fungsi murni: `mapAnime`, `mapEpisode`, `mapSearchItem`, `mapStream` (semua aturan §2 poin 4, termasuk `completed→complete`, `poster→posterUrl`, token→URL `/play/`, `default_player`→nama server, `enriching` diteruskan, `prev/next`). Null-safety: `genres ?? []`, `score ?? null`.
  Selesai jika: unit test matriks (ongoing item, completed item, item null-heavy, stream lengkap, stream tanpa next) hijau; ini task paling penting untuk kualitas.

- **T105 — Kerangka `AniStreamProvider` + cache TTL.**
  Berkas: `backend/src/providers/anistream/index.js`, `backend/src/providers/anistream/cache.js`. Cache sederhana `Map` + TTL (list/detail 60 detik, stream 30 detik, key = path+query). `refreshEpisode` MEMBYPASS cache.
  Selesai jika: unit test cache (kadaluarsa, bypass refresh) hijau.

### Fase B — Endpoint & refactor route

- **T106 — Perluas interface `ContentProvider`.**
  Berkas: `backend/src/providers/mock.js`, `backend/src/lib/query.js`. Tambah method: `listEpisodes(animeSlug, page, limit)` dan `getNeighbors(episodeSlug)`. MockProvider mendelegasikan ke query SQLite yang sudah ada. Route `anime.js`/`stream.js` tidak lagi memanggil `lib/query.js` langsung — semua lewat provider.
  Selesai jika: `npm test` backend tetap 100% hijau tanpa mengubah test lama (perilaku mock tak berubah).

- **T107 — Adapter `listOngoing` + `listComplete`.**
  Berkas: `backend/src/providers/anistream/index.js`. Panggil `/anime/ongoing` / `/anime/complete` dengan `?page=`; teruskan `page`, laporkan `pageSize` remote; abaikan `limit` (§2 poin 5).
  Selesai jika: unit test dengan fixture respons asli menghasilkan `Page` bentuk kita.

- **T108 — Adapter `getAnime` (detail + episodes).**
  Panggil `/anime/detail/:slug`; urutkan ulang `episodes` menjadi ASC by `episodeNumber` (kontrak kita); gabungkan meta paginasi episode (`totalEpisodeCount`, `episodePage`, dst.) mengikuti bentuk route detail sekarang.
  Selesai jika: fixture detail asli → respons route identik bentuknya dengan respons mock (bandingkan keys).

- **T109 — Adapter `searchAnime`.**
  Panggil `/anime/search?q=`; map `poster`→`posterUrl`, `status` completed→complete; kembalikan array domain.
  Selesai jika: unit test mapping + route `/search` tetap membungkus `{query, totalResults, data}`.

- **T110 — Adapter `getEpisode` + `refreshEpisode`.**
  Panggil `/stream/:slug` (refresh → `?refresh=true`, bypass cache); map §2 poin 4; struktur balik `{ episode, anime, streams }` + `enriching` (simpan di objek agar route bisa meneruskan). `prev/next` berasal dari remote, BUKAN dari hitungan lokal.
  Selesai jika: unit test fixture stream (dengan & tanpa next, `enriching:true`) hijau.

- **T111 — Route stream meneruskan `defaultPlayer` & `enriching`.**
  Berkas: `backend/src/routes/stream.js`. `defaultPlayer` = nama server dari token `default_player` (fallback: sumber pertama 720p). Respons menambah field `enriching` (boolean, default false untuk mock).
  Selesai jika: contract test route (mock provider) mencantumkan `enriching:false` dan `defaultPlayer` tak berubah dari sebelumnya.

### Fase C — Player & UX frontend

- **T112 — Watch page: pakai `url` remote sebagai iframe + fallback gambar.**
  Berkas: `frontend/src/pages/Watch.tsx`, `frontend/src/components/PlayerShell.tsx` (bila perlu), `frontend/src/components/AnimeCard.tsx`. Pastikan `PlayerShell` memakai `source.url` langsung (sudah mode `iframe`); tambah `onError` pada `<img>` poster di semua kartu → ganti ke placeholder SVG lokal `poster-placeholder.svg` (baru, generik tanpa menyapa merek AniStream).
  Selesai jika: build hijau + unit test fallback poster.

- **T113 — Tangani `enriching` di UI.**
  Bila respons stream `enriching: true`: tampilkan toast info "Sumber sedang disinkronkan ulang, beberapa kualitas mungkin belum tersedia" dan tetap render daftar kualitas yang ada. Tambah `enriching?: boolean` di `frontend/src/types.ts`.
  Selesai jika: unit test Watch dengan mock `enriching:true` menampilkan toast & tidak error.

- **T114 — Tombol "Muat ulang sumber" (opsional UX, tetap kerjakan).**
  Di Watch page, tombol kecil di samping switcher kualitas → panggil ulang API `?refresh=true` (endpoint client `api.stream(slug, { refresh: true })`), tampilkan skeleton singkat, ganti daftar stream.
  Selesai jika: unit test interaksi hijau; tidak ada state stale saat refresh.

### Fase D — Ketahanan & ops

- **T115 — Remote mati → 502 rapi.**
  Pastikan error dari `RemoteApiClient` (T102) mengalir jadi respons `502 {"error":"..."}` tanpa crash; rate-limit & helmet tetap jalan. Tambahkan handler error terpusat bila perlu.
  Selesai jika: unit test route dengan provider yang throw → 502 JSON.

- **T116 — `/health` melaporkan status upstream.**
  Bila `PROVIDER=anistream`: `/health` menambah `{ upstream: "up"|"down" }` hasil ping `/health` remote (cache 30 dtk). Mock: tetap `{"status":"ok"}`.
  Selesai jika: unit test kedua mode.

- **T117 — Dokumentasi env di README.**
  Bagian "Konfigurasi": `PROVIDER`, `ANISTREAM_API_URL`, perilaku default mock, catatan CORS §1.4 poin 1, dan peringatan legal §5.
  Selesai jika: README menyebut ketiganya + contoh `.env`.

- **T118 — Skrip dev `PROVIDER=anistream`.**
  Tambah npm script `dev:anistream` (root) yang menjalankan backend+frontend dengan `PROVIDER=anistream`. Jangan mengubah default `dev`.
  Selesai jika: `npm run dev:anistream` bisa jalan lokal (dicek manual).

### Fase E — Test & QA

- **T119 — Fixture respons asli.**
  Berkas: `backend/src/providers/anistream/__fixtures__/` (JSON hasil probe: ongoing page 1, complete page 1, detail `otome-game-mob-s2-sub-indo`, stream episode 9, search `otome`). Simpan apa adanya (data publik hasil probe), dipakai test T107–T110.
  Selesai jika: fixture ter-load di test tanpa jaringan.

- **T120 — Contract test provider anistream (mock server).**
  Test integrasi: hidupkan http server lokal yang menyajikan fixture, arahkan `ANISTREAM_API_URL` ke situ, jalankan app Express, dan asserting kontrak PRD §8 di `/ongoing`, `/complete`, `/detail/:slug`, `/search`, `/stream/:slug` — termasuk `completed→complete` dan `defaultPlayer` berupa nama server.
  Selesai jika: semua asserting hijau; test mock provider lama tetap hijau.

- **T121 — Smoke browser dengan provider asli.**
  Jalankan `dev:anistream`, buka beranda → ongoing → detail → watch. Verifikasi: daftar anime tampil, poster termuat (fallback bila gagal), iframe `/play/:token` termuat (cek elemen iframe + tidak ada error konsol fatal), switcher kualitas/server bekerja, prev/next episode bekerja. Catat temuan umur token.
  Selesai jika: checklist Preview diperbarui + bukti DOM/console terlampir di PR.

- **T122 — Uji beban ringan & batas laju kita sendiri.**
  Pukul `/stream` 25× cepat dari frontend dev (atau skrip) → pastikan rate limit backend kita (20/menit) tetap memicu 429 dengan `Retry-After`, bukan meneruskan 25 request ke remote beruntun (cache T105 harus menyerap sebagian).
  Selesai jika: log menunjukkan cache hit & 429 muncul sesuai aturan.

- **T123 — Freeze & dokumentasi.**
  Perbarui `docs/PRD.md` (addendum §12 "Provider AniStream Asli" merangkum §1–§2 dokumen ini), tandai selesai di file ini, commit final.
  Selesai jika: PRD + README + TODO-API konsisten.

---

## 4. Di luar cakupan

- Scraping otakudesu/file-host sendiri (tetap tanggung jawab operator, bukan kode).
- Sinkronisasi ke SQLite lokal / cache persisten (cache in-memory saja).
- Mengubah branding/aset: KageStream tetap identitas sendiri; hanya DATA yang diambil dari upstream.
- Sinkronisasi riwayat lintas perangkat, SSR, PWA (backlog lama).

## 5. Peringatan legal (wajib dibaca)

API upstream menyajikan konten anime **tanpa lisensi** (di-scrape dari otakudesu dan file-host mega/vidhide). Mengaktifkan `PROVIDER=anistream` membuat KageStream menjadi konsumen konten bajakan secara langsung; seluruh tanggung jawab hukum ada pada operator yang menjalankan `PROVIDER=anistream`, bukan pada kode. Karena itu `mock` tetap default dan semua task di dokumen ini murni teknis. Keputusan menyalakan provider asli = keputusan operator.
