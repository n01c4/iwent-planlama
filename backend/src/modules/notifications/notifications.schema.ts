import { z } from 'zod';

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export const NotificationTypeEnum = z.enum([
  'friend_request',
  'friend_accepted',
  'ticket_purchased',
  'ticket_gifted',
  'event_reminder',
  'event_cancelled',
  'event_updated',
  'message_received',
  'chat_mention',
  'payment_refunded',
  'broadcast',
]);

export const NotificationStatusEnum = z.enum(['unread', 'read']);

export const NotificationChannelEnum = z.enum(['push', 'email', 'in_app']);

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

export const notificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: NotificationStatusEnum.optional(),
});

export type NotificationsQuery = z.infer<typeof notificationsQuerySchema>;

// =============================================================================
// MUTATION SCHEMAS
// =============================================================================

export const markReadSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  all: z.boolean().optional(),
}).refine((data) => data.ids || data.all, {
  message: 'Either "ids" or "all" must be provided',
});

export type MarkReadInput = z.infer<typeof markReadSchema>;

export const broadcastSchema = z.object({
  eventId: z.string().uuid(),
  title: z.string().min(1).max(255),
  body: z.string().min(1).max(1000),
  type: z.enum(['announcement', 'reminder', 'update']),
  channels: z.array(NotificationChannelEnum).min(1).default(['in_app']),
});

export type BroadcastInput = z.infer<typeof broadcastSchema>;

// =============================================================================
// INTERNAL TYPES (for service use)
// =============================================================================

export interface CreateNotificationInput {
  userId: string;
  type: z.infer<typeof NotificationTypeEnum>;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  channels?: Array<'push' | 'email' | 'in_app'>;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
}
