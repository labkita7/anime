# KageStream

Platform streaming anime (klon fungsional AniStream) — frontend React/Vite + backend Express/SQLite. Lihat `docs/PRD.md` (spesifikasi) dan `docs/TODO.md` (rencana eksekusi).

## Menjalankan

```bash
npm install      # menginstal root + backend + frontend (npm workspaces)
npm run seed     # mengisi SQLite dengan 24 anime fixture fiktif (wajib sebelum dev)
npm run dev            # menjalankan backend :4000 + frontend :3000 bersamaan (provider mock)
npm run dev:anistream  # sama, tetapi PROVIDER=anistream (data dari API AniStream asli)
npm test         # vitest backend + frontend
npm run build    # build produksi frontend (dist/)
```

Backend melayani poster di `/posters/*` dan API di `/api/v1/*`. Frontend (dev) mem-proxy `/api` dan `/posters` ke backend. Untuk produksi single-origin, jalankan backend saja setelah `npm run build` — `server.js` dapat disambungkan untuk menyajikan `frontend/dist` (opsional, lihat TODO T036).

## Struktur

```
backend/    Express 4 + better-sqlite3, skema & kontrak API sesuai PRD §8–§9
frontend/   React 18 + TypeScript + Tailwind 3, halaman sesuai PRD §10
docs/       PRD.md (spesifikasi lengkap), TODO.md (task eksekusi)
```

## Env

| Variabel | Default | Keterangan |
|---|---|---|
| `PORT` | `4000` | Port backend |
| `PROVIDER` | `mock` | ContentProvider aktif: `mock` (SQLite fixture fiktif) atau `anistream` (proxy API AniStream asli) |
| `ANISTREAM_API_URL` | `https://anistreambo.hazz.biz.id/api/v1` | Base URL upstream (hanya dipakai saat `PROVIDER=anistream`) |
| `VITE_API_URL` | `/api/v1` | Base URL API untuk frontend |

### Provider `anistream`

`npm run dev:anistream` menjalankan backend sebagai proxy/adapter ke API AniStream asli: frontend tetap memanggil `/api/v1` milik sendiri (kontrak PRD §8 tidak berubah), sementara backend mengambil data upstream dan memetakannya. Ini wajib karena CORS upstream hanya mengizinkan origin resmi AniStream. Poster di-hotlink langsung oleh browser; bila gagal dimuat, tampil placeholder lokal. Rincian teknis: `docs/TODO-API.md`.

## Sumber konten

Dua mode: `PROVIDER=mock` (default) memakai fixture **fiktif** (`backend/fixtures/anime.fixture.json`); `PROVIDER=anistream` memakai data nyata dari API AniStream yang **tidak berlisensi** (scrape otakudesu + file-host pihak ketiga). Mengaktifkan provider asli — dan seluruh konsekuensi legalnya — sepenuhnya menjadi tanggung jawab operator (PRD §11).
