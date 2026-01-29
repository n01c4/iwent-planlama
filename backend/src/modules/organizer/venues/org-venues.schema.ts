import { z } from 'zod';

/**
 * Create Venue Schema
 */
export const createVenueSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  city: z.string().max(100),
  address: z.string().max(500).optional(),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  profilePhotoUrl: z.string().url().optional(),
  coverPhotoUrl: z.string().url().optional(),
  capacity: z.number().int().positive().optional(),
  amenities: z.array(z.string()).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  socialLinks: z.record(z.string()).optional(),
  operatingHours: z.record(z.any()).optional(),
});

export type CreateVenueInput = z.infer<typeof createVenueSchema>;

/**
 * Update Venue Schema
 */
export const updateVenueSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  city: z.string().max(100).optional(),
  address: z.string().max(500).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  profilePhotoUrl: z.string().url().optional().nullable(),
  coverPhotoUrl: z.string().url().optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
  amenities: z.array(z.string()).optional(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
  socialLinks: z.record(z.string()).optional(),
  operatingHours: z.record(z.any()).optional(),
});

export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;

/**
 * Venue ID Params Schema
 */
export const venueIdParamsSchema = z.object({
  id: z.string().uuid('Invalid venue ID'),
});

export type VenueIdParams = z.infer<typeof venueIdParamsSchema>;

/**
 * Venues Query Schema
 */
export const orgVenuesQuerySchema = z.object({
  search: z.string().optional(),
});

export type OrgVenuesQueryInput = z.infer<typeof orgVenuesQuerySchema>;
