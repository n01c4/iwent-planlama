import { z } from 'zod';

/**
 * Create Artist Schema
 */
export const createArtistSchema = z.object({
  name: z.string().min(2).max(200),
  bio: z.string().max(5000).optional(),
  profilePhotoUrl: z.string().url().optional(),
  coverPhotoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  socialLinks: z.record(z.string()).optional(),
  genres: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateArtistInput = z.infer<typeof createArtistSchema>;

/**
 * Update Artist Schema
 */
export const updateArtistSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  bio: z.string().max(5000).optional().nullable(),
  profilePhotoUrl: z.string().url().optional().nullable(),
  coverPhotoUrl: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  socialLinks: z.record(z.string()).optional(),
  genres: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export type UpdateArtistInput = z.infer<typeof updateArtistSchema>;

/**
 * Artist ID Params Schema
 */
export const artistIdParamsSchema = z.object({
  id: z.string().uuid('Invalid artist ID'),
});

export type ArtistIdParams = z.infer<typeof artistIdParamsSchema>;

/**
 * Artists Query Schema
 */
export const orgArtistsQuerySchema = z.object({
  search: z.string().optional(),
});

export type OrgArtistsQueryInput = z.infer<typeof orgArtistsQuerySchema>;
