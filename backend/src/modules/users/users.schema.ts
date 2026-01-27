import { z } from 'zod';

// Will be expanded when user endpoints are implemented
export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  city: z.string().optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  avatarUrl: z.string().url().optional(),
  preferences: z.object({
    language: z.enum(['tr', 'en']).optional(),
    addressingStyle: z.enum(['sen', 'siz']).optional(),
    notifications: z.object({
      push: z.boolean().optional(),
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

export const userParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserParams = z.infer<typeof userParamsSchema>;
