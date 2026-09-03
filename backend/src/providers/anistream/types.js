/**
 * Tipe DTO (Data Transfer Object) respons API AniStream upstream.
 *
 * Sumber temuan: reverse engineering anistreambo.hazz.biz.id/api/v1 (2026-09-02),
 * lihat docs/TODO-API.md §1. Field bisa null ditandai eksplisit; string numerik
 * (score, totalEpisodes, duration) memang dikirim upstream sebagai string.
 */

/**
 * Respons list (ongoing/complete).
 * @typedef {object} RemoteListResponse
 * @property {RemoteAnime[]} data
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalPages
 * @property {number} total
 */

/**
 * Item anime (list & detail; detail menambah `episodes`).
 * @typedef {object} RemoteAnime
 * @property {number} id
 * @property {string} slug
 * @property {string} title
 * @property {string|null} japaneseTitle
 * @property {string|null} posterUrl
 * @property {string|null} synopsis
 * @property {string|null} score        // string angka, mis. "6.81"
 * @property {string} status            // "ongoing" | "completed"
 * @property {string|null} type         // "TV", "Movie", ...
 * @property {string|null} totalEpisodes // string angka
 * @property {string|null} duration     // mis. "23 min. per ep."
 * @property {string|null} releaseDay
 * @property {string|null} releaseDate
 * @property {string|null} studio
 * @property {string[]|null} genres
 * @property {number} sortOrder
 * @property {RemoteEpisode[]} [episodes] // hanya pada /anime/detail/:slug, urut DESC
 * @property {string} [sourceUrl]
 * @property {string} [lastSyncedAt]
 */

/**
 * Item episode di dalam detail anime.
 * @typedef {object} RemoteEpisode
 * @property {number} id
 * @property {number} animeId
 * @property {string} slug
 * @property {string} title
 * @property {number} episodeNumber
 * @property {string|null} releaseDate
 * @property {string} [sourceUrl]
 * @property {string} [lastSyncedAt]
 */

/**
 * Respons search — TANPA paginasi; `?page` diabaikan upstream.
 * @typedef {object} RemoteSearchResponse
 * @property {string} query
 * @property {number} total_results
 * @property {RemoteSearchItem[]} data
 */

/**
 * Item ringkas hasil search (nama field berbeda dari item list!).
 * @typedef {object} RemoteSearchItem
 * @property {string} title
 * @property {string} slug
 * @property {string|null} poster   // bukan posterUrl
 * @property {string} status
 * @property {string|null} score
 */

/**
 * Respons stream — snake_case, berbeda gaya dari list/detail (camelCase).
 * @typedef {object} RemoteStreamResponse
 * @property {string} title
 * @property {string} anime_slug
 * @property {string} anime_title
 * @property {string|null} poster_url
 * @property {number} episode_number
 * @property {string|null} synopsis
 * @property {string|null} score
 * @property {string|null} studio
 * @property {string[]|null} genres
 * @property {string|null} duration
 * @property {string|null} release_day
 * @property {string} status
 * @property {string|null} prev_episode_slug
 * @property {string|null} next_episode_slug
 * @property {string|null} default_player // UUID token sumber default
 * @property {Record<string, RemoteStreamSource[]>} streams // kunci "720p"|"480p"|"360p"
 * @property {boolean} enriching          // true saat sinkronisasi ulang berjalan
 */

/**
 * Satu sumber stream: token UUID yang di-resolve via GET /play/:token (HTML embed).
 * @typedef {object} RemoteStreamSource
 * @property {string} server  // "mega" | "vidhide"
 * @property {string} token
 */

export {};
