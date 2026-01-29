import { z } from 'zod';

/**
 * Ticket ID Params Schema
 */
export const ticketIdParamsSchema = z.object({
  id: z.string().uuid('Invalid ticket ID'),
});

export type TicketIdParams = z.infer<typeof ticketIdParamsSchema>;

/**
 * User Tickets Query Schema
 */
export const userTicketsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['RESERVED', 'CONFIRMED', 'CANCELLED', 'REFUNDED']).optional(),
  upcoming: z.coerce.boolean().optional(), // Only show tickets for future events
});

export type UserTicketsQueryInput = z.infer<typeof userTicketsQuerySchema>;

/**
 * Refund Request Schema
 */
export const refundRequestSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
});

export type RefundRequestInput = z.infer<typeof refundRequestSchema>;

/**
 * Transfer Ticket Schema
 */
export const transferTicketSchema = z.object({
  recipientEmail: z.string().email('Invalid email address'),
});

export type TransferTicketInput = z.infer<typeof transferTicketSchema>;
