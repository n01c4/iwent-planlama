import { z } from 'zod';

/**
 * Event Orders Query Schema
 */
export const eventOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'confirmed', 'failed', 'cancelled', 'refunded']).optional(),
  search: z.string().optional(), // Search by order number or customer email
});

export type EventOrdersQueryInput = z.infer<typeof eventOrdersQuerySchema>;

/**
 * Event ID Params Schema
 */
export const eventIdParamsSchema = z.object({
  id: z.string().uuid('Invalid event ID'),
});

export type EventIdParams = z.infer<typeof eventIdParamsSchema>;

/**
 * Order ID Params Schema
 */
export const orderIdParamsSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
});

export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;

/**
 * Refund Order Schema
 */
export const refundOrderSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
  amount: z.number().positive().optional(), // Optional partial refund amount
});

export type RefundOrderInput = z.infer<typeof refundOrderSchema>;
