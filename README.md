# KageStream

Platform streaming anime (klon fungsional AniStream) — frontend React/Vite + backend Express/SQLite. Lihat `docs/PRD.md` (spesifikasi) dan `docs/TODO.md` (rencana eksekusi).

## Menjalankan

```bash
npm install      # menginstal root + backend + frontend (npm workspaces)
npm run seed     # mengisi SQLite dengan 24 anime fixture fiktif (wajib sebelum dev)
npm run dev      # menjalankan backend :4000 + frontend :3000 bersamaan
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
| `PROVIDER` | `mock` | ContentProvider aktif (hanya `mock` di scope ini) |
| `VITE_API_URL` | `/api/v1` | Base URL API untuk frontend |

## Sumber konten

Seluruh data berasal dari fixture **fiktif** (`backend/fixtures/anime.fixture.json`) melalui abstraction `ContentProvider` (PRD §11). Menghubungkan provider ke sumber eksternal — dan legalitasnya — sepenuhnya menjadi tanggung jawab operator.
