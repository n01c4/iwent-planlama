import { z } from 'zod';

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

export const chatsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const messagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().uuid().optional(), // Cursor: get messages before this ID
  after: z.string().uuid().optional(), // Cursor: get messages after this ID
});

// =============================================================================
// PARAMS SCHEMAS
// =============================================================================

export const chatIdParamsSchema = z.object({
  chatId: z.string().uuid('Invalid chat ID'),
});

// =============================================================================
// BODY SCHEMAS
// =============================================================================

export const createPersonalChatSchema = z.object({
  friendId: z.string().uuid('Invalid friend ID'),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(4000, 'Message too long'),
  replyToId: z.string().uuid().optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(['image', 'video', 'audio', 'file']).optional(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Use z.output for types with defaults (represents parsed output, not input)
export type ChatsQuery = z.output<typeof chatsQuerySchema>;
export type MessagesQuery = z.output<typeof messagesQuerySchema>;
export type ChatIdParams = z.infer<typeof chatIdParamsSchema>;
export type CreatePersonalChatInput = z.infer<typeof createPersonalChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
