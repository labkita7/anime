import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { api, ApiError } from './api';

function mockFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', ...headers },
    })
  );
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api client', () => {
  it('membangun URL ongoing dengan query page & limit', async () => {
    const mock = mockFetch(200, { data: [], page: 1, pageSize: 24, totalPages: 0, total: 0 });
    vi.stubGlobal('fetch', mock);
    await api.ongoing(2, 12);
    expect(mock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/anime/ongoing?page=2&limit=12'),
      expect.objectContaining({ headers: { Accept: 'application/json' } })
    );
  });

  it('melempar ApiError dengan retryAfter dari header', async () => {
    vi.stubGlobal('fetch', mockFetch(429, { error: 'Terlalu banyak permintaan' }, { 'Retry-After': '30' }));
    const err = await api.search('kage').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(429);
    expect(err.retryAfter).toBe(30);
    expect(err.message).toBe('Terlalu banyak permintaan');
  });

  it('melempar ApiError tanpa retryAfter bila header tidak ada', async () => {
    vi.stubGlobal('fetch', mockFetch(404, { error: 'Episode tidak ditemukan' }));
    const err = await api.stream('x').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
    expect(err.retryAfter).toBeNull();
  });

  it('meng-encode slug pada detail', async () => {
    const mock = mockFetch(200, {});
    vi.stubGlobal('fetch', mock);
    await api.detail('kage no tabi');
    expect(mock).toHaveBeenCalledWith(expect.stringContaining('/anime/detail/kage%20no%20tabi'), expect.anything());
  });
});
