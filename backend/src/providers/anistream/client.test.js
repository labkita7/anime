import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRemoteClient, UpstreamError } from './client.js';

const client = createRemoteClient('https://upstream.example/api/v1');

function jsonResponse(status, body) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createRemoteClient', () => {
  it('mengembalikan JSON pada 200 dan mengirim query + header', async () => {
    const fake = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fake);
    const body = await client.request('/anime/ongoing', { query: { page: 2 } });
    expect(body).toEqual({ ok: true });
    const [url, init] = fake.mock.calls[0];
    expect(String(url)).toBe('https://upstream.example/api/v1/anime/ongoing?page=2');
    expect(init.headers.Accept).toBe('application/json');
    expect(init.headers['User-Agent']).toMatch(/Mozilla/);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('mengembalikan null pada 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(404, { error: 'x' })));
    await expect(client.request('/anime/detail/tidak-ada')).resolves.toBeNull();
  });

  it('melempar UpstreamError status 502 pada 5xx', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(500, 'boom')));
    const err = await client.request('/anime/ongoing').catch((e) => e);
    expect(err).toBeInstanceOf(UpstreamError);
    expect(err.status).toBe(502);
    expect(err.message).toMatch(/500/);
  });

  it('melempar UpstreamError saat jaringan gagal', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    const err = await client.request('/anime/ongoing').catch((e) => e);
    expect(err).toBeInstanceOf(UpstreamError);
    expect(err.status).toBe(502);
    expect(err.message).toBe('Sumber upstream tidak tersedia');
  });

  it('melempar UpstreamError saat body bukan JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>', { status: 200 })));
    const err = await client.request('/anime/ongoing').catch((e) => e);
    expect(err).toBeInstanceOf(UpstreamError);
    expect(err.message).toBe('Respons upstream tidak valid');
  });
});
