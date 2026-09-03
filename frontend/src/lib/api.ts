import type {
  AnimeDetail,
  Page,
  Anime,
  SearchResult,
  StreamPayload,
} from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export class ApiError extends Error {
  status: number;
  retryAfter: number | null;

  constructor(status: number, message: string, retryAfter: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

async function request<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } });
  } catch {
    throw new ApiError(0, 'Tidak dapat terhubung ke server');
  }
  if (!res.ok) {
    let message = `Request gagal (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // respons non-JSON: pakai pesan default
    }
    const retryAfterHeader = res.headers.get('retry-after');
    const retryAfter = retryAfterHeader
      ? Math.max(1, Number.parseInt(retryAfterHeader, 10) || 60)
      : null;
    throw new ApiError(res.status, message, retryAfter);
  }
  return (await res.json()) as T;
}

export const api = {
  ongoing(page = 1, limit = 24) {
    return request<Page<Anime>>(`/anime/ongoing?page=${page}&limit=${limit}`);
  },
  complete(page = 1, limit = 24) {
    return request<Page<Anime>>(`/anime/complete?page=${page}&limit=${limit}`);
  },
  detail(slug: string, page = 1, limit = 100) {
    return request<AnimeDetail>(
      `/anime/detail/${encodeURIComponent(slug)}?page=${page}&limit=${limit}`
    );
  },
  search(q: string) {
    return request<SearchResult>(`/anime/search?q=${encodeURIComponent(q)}`);
  },
  stream(episodeSlug: string, refresh = false) {
    return request<StreamPayload>(
      `/stream/${encodeURIComponent(episodeSlug)}${refresh ? '?refresh=true' : ''}`
    );
  },
};
