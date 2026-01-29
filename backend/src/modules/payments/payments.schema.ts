import { z } from 'zod';

/**
 * Create Payment Intent Schema
 */
export const createPaymentIntentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  method: z.enum(['card', 'bank_transfer']).default('card'),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;

/**
 * Confirm Order Schema
 */
export const confirmOrderPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
  clientSecret: z.string().min(1, 'Client secret is required'),
});

export type ConfirmOrderPaymentInput = z.infer<typeof confirmOrderPaymentSchema>;

/**
 * Mock Checkout Schema (for development only)
 */
export const mockCheckoutSchema = z.object({
  action: z.enum(['success', 'fail']),
  cardLast4: z.string().length(4).optional(),
});

export type MockCheckoutInput = z.infer<typeof mockCheckoutSchema>;

/**
 * Intent ID Params Schema
 */
export const intentIdParamsSchema = z.object({
  intentId: z.string().uuid('Invalid intent ID'),
});

export type IntentIdParams = z.infer<typeof intentIdParamsSchema>;

/**
 * Order ID Params Schema
 */
export const orderIdParamsSchema = z.object({
  id: z.string().uuid('Invalid order ID'),
});

export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;
