import { z } from 'zod';

/**
 * Venues Query Schema
 * OpenAPI compliant: search, city
 */
export const venuesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(), // OpenAPI: search param
  city: z.string().optional(),
  capacityMin: z.coerce.number().int().positive().optional(),
  capacityMax: z.coerce.number().int().positive().optional(),
  isVerified: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'eventCount', 'averageRating', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type VenuesQueryInput = z.infer<typeof venuesQuerySchema>;

/**
 * Venue ID Params Schema
 */
export const venueIdParamsSchema = z.object({
  id: z.string().uuid('Invalid venue ID'),
});

export type VenueIdParams = z.infer<typeof venueIdParamsSchema>;

/**
 * Venue Slug Params Schema
 */
export const venueSlugParamsSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export type VenueSlugParams = z.infer<typeof venueSlugParamsSchema>;

/**
 * Venue Events Query Schema
 */
export const venueEventsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  upcoming: z.coerce.boolean().default(true),
});

export type VenueEventsQueryInput = z.infer<typeof venueEventsQuerySchema>;
