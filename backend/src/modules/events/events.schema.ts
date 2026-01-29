import { z } from 'zod';

/**
 * Events Query Schema
 * For GET /events with filters
 * OpenAPI compliant: search, city, category, artistId, venueId, dateFrom, dateTo
 */
export const eventsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // Search (title, description)
  search: z.string().optional(),
  // Category filters
  category: z.string().optional(), // category slug for OpenAPI compliance
  categoryId: z.string().uuid().optional(),
  categorySlug: z.string().optional(), // alias for category
  // Location
  city: z.string().optional(),
  // Relations
  artistId: z.string().uuid().optional(),
  venueId: z.string().uuid().optional(),
  // Date range (OpenAPI: dateFrom, dateTo)
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  startDateFrom: z.coerce.date().optional(), // legacy alias
  startDateTo: z.coerce.date().optional(), // legacy alias
  // Price
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  // Status (for organizer panel, public API defaults to 'published')
  status: z.enum(['draft', 'published', 'unpublished', 'cancelled']).optional(),
  isOnline: z.coerce.boolean().optional(),
  // Sorting
  sortBy: z.enum(['startDate', 'priceMin', 'createdAt', 'likeCount', 'viewCount']).default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type EventsQueryInput = z.infer<typeof eventsQuerySchema>;

/**
 * Event ID Params Schema
 */
export const eventIdParamsSchema = z.object({
  id: z.string().uuid('Invalid event ID'),
});

export type EventIdParams = z.infer<typeof eventIdParamsSchema>;

/**
 * Event Slug Params Schema
 */
export const eventSlugParamsSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export type EventSlugParams = z.infer<typeof eventSlugParamsSchema>;

/**
 * Event Attendees Query Schema (Faz 5)
 */
export const eventAttendeesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type EventAttendeesQueryInput = z.infer<typeof eventAttendeesQuerySchema>;
