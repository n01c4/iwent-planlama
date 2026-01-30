import { z } from 'zod';

// =============================================================================
// REPORT TYPES
// =============================================================================

export const ReportEntityTypeEnum = z.enum(['message', 'user', 'event', 'review']);
export const ReportStatusEnum = z.enum(['pending', 'resolved', 'dismissed']);
export const ReportActionTypeEnum = z.enum(['warning', 'message_deleted', 'user_banned', 'none']);

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

export const reportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: ReportStatusEnum.optional(),
  entityType: ReportEntityTypeEnum.optional(),
});

export type ReportsQuery = z.infer<typeof reportsQuerySchema>;

export const chatsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  eventId: z.string().uuid().optional(),
  isFrozen: z.coerce.boolean().optional(),
});

export type ChatsQuery = z.infer<typeof chatsQuerySchema>;

export const chatMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ChatMessagesQuery = z.infer<typeof chatMessagesQuerySchema>;

// =============================================================================
// PARAM SCHEMAS
// =============================================================================

export const reportIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type ReportIdParams = z.infer<typeof reportIdParamsSchema>;

export const chatIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type ChatIdParams = z.infer<typeof chatIdParamsSchema>;

// =============================================================================
// MUTATION SCHEMAS
// =============================================================================

export const createReportSchema = z.object({
  entityType: ReportEntityTypeEnum,
  entityId: z.string().uuid(),
  reason: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const reportActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'archive']),
  actionNote: z.string().max(500).optional(),
  userAction: z.enum(['warning', 'ban', 'none']).optional(),
});

export type ReportActionInput = z.infer<typeof reportActionSchema>;

export const chatActionSchema = z.object({
  action: z.enum(['freeze', 'unfreeze', 'delete', 'clear-history']),
  reason: z.string().max(500).optional(),
  notifyParticipants: z.boolean().default(false),
});

export type ChatActionInput = z.infer<typeof chatActionSchema>;

export const updateFiltersSchema = z.object({
  blockedWords: z.array(z.string()).optional(),
  blockedPatterns: z.array(z.string()).optional(),
  spamProtection: z.boolean().optional(),
  mediaFilter: z.boolean().optional(),
  linkFilter: z.boolean().optional(),
});

export type UpdateFiltersInput = z.infer<typeof updateFiltersSchema>;

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface ReportResponse {
  id: string;
  entityType: string;
  entityId: string;
  reason: string;
  description: string | null;
  status: string;
  actionTaken: string | null;
  actionNote: string | null;
  reportedBy: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  resolvedBy: {
    id: string;
    name: string | null;
  } | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface ModerationChatResponse {
  id: string;
  name: string | null;
  type: string;
  eventId: string | null;
  event: {
    id: string;
    title: string;
  } | null;
  participantCount: number;
  messageCount: number;
  isFrozen: boolean;
  frozenAt: Date | null;
  frozenBy: {
    id: string;
    name: string | null;
  } | null;
  lastMessageAt: Date | null;
  createdAt: Date;
}

export interface ModerationFiltersResponse {
  blockedWords: string[];
  blockedPatterns: string[];
  spamProtection: boolean;
  mediaFilter: boolean;
  linkFilter: boolean;
  updatedAt: Date;
}
