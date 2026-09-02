import { z } from 'zod';

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export const detailQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(100),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2, 'q minimal 2 karakter').max(100, 'q maksimal 100 karakter'),
});

export const streamQuerySchema = z.object({
  refresh: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export function parseQuery(schema, query) {
  const result = schema.safeParse(query);
  if (!result.success) {
    const issue = result.error.issues[0];
    const err = new Error(issue.message);
    err.status = 400;
    throw err;
  }
  return result.data;
}
