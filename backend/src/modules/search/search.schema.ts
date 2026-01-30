import { z } from 'zod';

/**
 * Search Query Schema (keyword-based)
 */
export const searchQuerySchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters'),
  type: z.enum(['all', 'events', 'venues', 'artists']).default('all'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  city: z.string().optional(),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

/**
 * Natural Language Search Request Schema
 * POST /search/natural
 */
export const naturalSearchSchema = z.object({
  query: z
    .string()
    .min(3, 'Query must be at least 3 characters')
    .max(500, 'Query must be at most 500 characters'),
  limit: z.number().int().min(1).max(50).default(10),
  userPreferences: z
    .object({
      city: z.string().optional(),
      categories: z.array(z.string()).optional(),
      priceRange: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type NaturalSearchInput = z.infer<typeof naturalSearchSchema>;

/**
 * Search Result Item Schema
 */
export const searchResultItemSchema = z.object({
  type: z.enum(['event', 'venue', 'artist']),
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  city: z.string().nullable(),
  extra: z.record(z.unknown()).optional(),
});

/**
 * Natural Search Response Schema
 */
export const naturalSearchResponseSchema = z.object({
  results: z.object({
    events: z.array(searchResultItemSchema),
    venues: z.array(searchResultItemSchema),
    artists: z.array(searchResultItemSchema),
  }),
  metadata: z.object({
    query: z.string(),
    parsedIntent: z.object({
      searchType: z.enum(['event', 'venue', 'artist', 'mixed']),
      dateRange: z
        .object({
          start: z.string().optional(),
          end: z.string().optional(),
        })
        .optional(),
      location: z.string().optional(),
      categories: z.array(z.string()).optional(),
      keywords: z.array(z.string()).optional(),
    }),
    fallbackUsed: z.boolean(),
    responseTimeMs: z.number(),
  }),
  total: z.number(),
});

export type NaturalSearchResponse = z.infer<typeof naturalSearchResponseSchema>;
