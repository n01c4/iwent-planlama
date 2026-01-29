import { z } from 'zod';

/**
 * Create Ticket Type Schema
 */
export const createTicketTypeSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  price: z.number().min(0),
  currency: z.string().default('TRY'),
  capacity: z.number().int().positive(),
  saleStartDate: z.coerce.date().optional(),
  saleEndDate: z.coerce.date().optional(),
  minPerOrder: z.number().int().min(1).default(1),
  maxPerOrder: z.number().int().min(1).default(10),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export type CreateTicketTypeInput = z.infer<typeof createTicketTypeSchema>;

/**
 * Update Ticket Type Schema
 */
export const updateTicketTypeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  price: z.number().min(0).optional(),
  capacity: z.number().int().positive().optional(),
  saleStartDate: z.coerce.date().optional().nullable(),
  saleEndDate: z.coerce.date().optional().nullable(),
  minPerOrder: z.number().int().min(1).optional(),
  maxPerOrder: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type UpdateTicketTypeInput = z.infer<typeof updateTicketTypeSchema>;

/**
 * Event ID Params Schema
 */
export const eventIdParamsSchema = z.object({
  id: z.string().uuid('Invalid event ID'),
});

export type EventIdParams = z.infer<typeof eventIdParamsSchema>;

/**
 * Ticket Type ID Params Schema
 */
export const ticketTypeIdParamsSchema = z.object({
  id: z.string().uuid('Invalid ticket type ID'),
});

export type TicketTypeIdParams = z.infer<typeof ticketTypeIdParamsSchema>;
