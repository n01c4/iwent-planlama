import { z } from 'zod';

/**
 * Search Query Schema
 */
export const searchQuerySchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters'),
  type: z.enum(['all', 'events', 'venues', 'artists']).default('all'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  city: z.string().optional(),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
