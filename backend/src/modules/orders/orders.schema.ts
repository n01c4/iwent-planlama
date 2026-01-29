import { z } from 'zod';

/**
 * Create Order Schema
 */
export const createOrderSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  items: z.array(z.object({
    ticketTypeId: z.string().uuid('Invalid ticket type ID'),
    quantity: z.number().int().min(1).max(10),
  })).min(1, 'At least one item is required'),
  discountCode: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/**
 * Confirm Order Schema
 */
export const confirmOrderSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
});

export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;

/**
 * Order ID Params Schema
 */
export const orderIdParamsSchema = z.object({
  id: z.string().uuid('Invalid order ID'),
});

export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;

/**
 * User Orders Query Schema
 */
export const userOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['pending', 'confirmed', 'failed', 'cancelled', 'refunded']).optional(),
});

export type UserOrdersQueryInput = z.infer<typeof userOrdersQuerySchema>;
