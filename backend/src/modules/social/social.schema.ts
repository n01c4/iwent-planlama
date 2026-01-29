import { z } from 'zod';

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const friendRequestsQuerySchema = paginationQuerySchema.extend({
  type: z.enum(['sent', 'received', 'all']).default('all'),
});

export const friendsSearchQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
});

// =============================================================================
// PARAMS SCHEMAS
// =============================================================================

export const friendRequestIdParamsSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
});

export const friendIdParamsSchema = z.object({
  friendId: z.string().uuid('Invalid friend ID'),
});

export const userIdParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export const eventIdParamsSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
});

// =============================================================================
// BODY SCHEMAS
// =============================================================================

export const sendFriendRequestSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export const respondFriendRequestSchema = z.object({
  action: z.enum(['accept', 'reject']),
});

export const likeEventSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Use z.output for types with defaults (represents parsed output, not input)
export type PaginationQuery = z.output<typeof paginationQuerySchema>;
export type FriendRequestsQuery = z.output<typeof friendRequestsQuerySchema>;
export type FriendsSearchQuery = z.output<typeof friendsSearchQuerySchema>;
export type FriendRequestIdParams = z.infer<typeof friendRequestIdParamsSchema>;
export type FriendIdParams = z.infer<typeof friendIdParamsSchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type EventIdParams = z.infer<typeof eventIdParamsSchema>;
export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>;
export type RespondFriendRequestInput = z.infer<typeof respondFriendRequestSchema>;
export type LikeEventInput = z.infer<typeof likeEventSchema>;
