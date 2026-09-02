export function clampInt(value, { min, max, def }) {
  const n = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(n)) return def;
  return Math.min(max, Math.max(min, n));
}

export function buildPageMeta(page, pageSize, total) {
  return {
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    total,
  };
}
