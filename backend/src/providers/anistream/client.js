// Klien HTTP untuk API AniStream upstream. Satu pintu agar error jaringan,
// timeout, dan pemetaan status cukup diuji di satu tempat.

const BROWSER_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export const DEFAULT_TIMEOUT_MS = 8000;

export class UpstreamError extends Error {
  constructor(message, { status = 502, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'UpstreamError';
    // server.js membaca err.status untuk kode respons; statusCode untuk test.
    this.status = status;
    this.statusCode = status;
  }
}

/**
 * @param {string} baseUrl mis. "https://anistreambo.hazz.biz.id/api/v1"
 * @param {{ timeoutMs?: number, fetchImpl?: typeof fetch }} [options]
 */
export function createRemoteClient(baseUrl, options = {}) {
  const base = baseUrl.replace(/\/+$/, '');
  // Resolusi fetch saat pemanggilan (bukan saat create) agar stub global
  // di test tetap terpakai.
  const doFetch = options.fetchImpl ?? ((url, init) => globalThis.fetch(url, init));

  return {
    /**
     * GET JSON dari upstream.
     * @returns {Promise<object|null>} null bila 404 (not found), lempar UpstreamError bila gagal.
     */
    async request(path, { query = {}, timeoutMs } = {}) {
      const suffix = path.startsWith('/') ? path : `/${path}`;
      const url = new URL(`${base}${suffix}`);
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, String(value));
      }

      let res;
      try {
        res = await doFetch(url, {
          headers: { Accept: 'application/json', 'User-Agent': BROWSER_UA },
          signal: AbortSignal.timeout(timeoutMs ?? options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
        });
      } catch (cause) {
        throw new UpstreamError('Sumber upstream tidak tersedia', { cause });
      }

      if (res.status === 404) return null;
      if (!res.ok) {
        throw new UpstreamError(`Sumber upstream merespons ${res.status}`);
      }
      try {
        return await res.json();
      } catch (cause) {
        throw new UpstreamError('Respons upstream tidak valid', { cause });
      }
    },
  };
}
