import { z } from 'zod';

/**
 * Artists Query Schema
 * OpenAPI compliant: search, genre
 */
export const artistsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(), // OpenAPI: search param
  genre: z.string().optional(),
  isVerified: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'followerCount', 'eventCount', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Use z.output for types with defaults (represents parsed output, not input)
export type ArtistsQueryInput = z.output<typeof artistsQuerySchema>;

/**
 * Artist ID Params Schema
 */
export const artistIdParamsSchema = z.object({
  id: z.string().uuid('Invalid artist ID'),
});

export type ArtistIdParams = z.infer<typeof artistIdParamsSchema>;

/**
 * Artist Slug Params Schema
 */
export const artistSlugParamsSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export type ArtistSlugParams = z.infer<typeof artistSlugParamsSchema>;

/**
 * Artist Events Query Schema
 */
export const artistEventsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  upcoming: z.coerce.boolean().default(true),
});

export type ArtistEventsQueryInput = z.output<typeof artistEventsQuerySchema>;

/**
 * Followed Artists Query Schema (Faz 5)
 */
export const followedArtistsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type FollowedArtistsQueryInput = z.output<typeof followedArtistsQuerySchema>;
