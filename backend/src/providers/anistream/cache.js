// Cache in-memory sederhana ber-TTL untuk menahan beban ke upstream.
// Proses tunggal cukup; tidak perlu Redis pada skala ini.

export function createCache() {
  const map = new Map(); // key -> { value, expiresAt }

  return {
    get(key) {
      const entry = map.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= Date.now()) {
        map.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value, ttlMs) {
      map.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
    delete(key) {
      map.delete(key);
    },
  };
}
