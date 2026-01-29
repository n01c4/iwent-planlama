import { z } from 'zod';

/**
 * Organizer Events Query Schema
 */
export const orgEventsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['draft', 'published', 'unpublished', 'cancelled']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['startDate', 'createdAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type OrgEventsQueryInput = z.infer<typeof orgEventsQuerySchema>;

/**
 * Create Event Schema
 */
export const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(10000).optional(),
  shortDescription: z.string().max(500).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  venueId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  bannerUrl: z.string().url().optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  isOnline: z.boolean().default(false),
  onlineUrl: z.string().url().optional(),
  totalCapacity: z.number().int().positive().optional(),
  artistIds: z.array(z.string().uuid()).optional(),
  settings: z.object({
    allowChat: z.boolean().default(true),
    showAttendeeCount: z.boolean().default(true),
    requireApproval: z.boolean().default(false),
    ageRestriction: z.number().int().positive().optional(),
  }).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

/**
 * Update Event Schema
 */
export const updateEventSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(10000).optional(),
  shortDescription: z.string().max(500).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional().nullable(),
  venueId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  isOnline: z.boolean().optional(),
  onlineUrl: z.string().url().optional().nullable(),
  totalCapacity: z.number().int().positive().optional().nullable(),
  artistIds: z.array(z.string().uuid()).optional(),
  settings: z.object({
    allowChat: z.boolean().optional(),
    showAttendeeCount: z.boolean().optional(),
    requireApproval: z.boolean().optional(),
    ageRestriction: z.number().int().positive().optional().nullable(),
  }).optional(),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

/**
 * Event ID Params Schema
 */
export const eventIdParamsSchema = z.object({
  id: z.string().uuid('Invalid event ID'),
});

export type EventIdParams = z.infer<typeof eventIdParamsSchema>;
