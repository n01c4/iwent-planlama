import { z } from 'zod';

/**
 * Organizer Profile Update Schema
 */
export const updateProfileSchema = z.object({
  businessName: z.string().min(2).max(100).optional(),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  socialLinks: z.record(z.string()).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Invite Team Member Schema
 */
export const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'member']).default('member'),
  permissions: z.array(z.string()).default([]),
});

export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;

/**
 * Update Team Member Schema
 */
export const updateTeamMemberSchema = z.object({
  role: z.enum(['admin', 'manager', 'member']).optional(),
  permissions: z.array(z.string()).optional(),
});

export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;

/**
 * Team Member ID Params Schema
 */
export const teamMemberIdParamsSchema = z.object({
  id: z.string().uuid('Invalid team member ID'),
});

export type TeamMemberIdParams = z.infer<typeof teamMemberIdParamsSchema>;
