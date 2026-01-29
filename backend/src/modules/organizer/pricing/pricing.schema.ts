import { z } from 'zod';

// ============================================================================
// DISCOUNT CODES
// ============================================================================

/**
 * Create Discount Code Schema
 */
export const createDiscountCodeSchema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Z0-9]+$/, 'Code must be uppercase alphanumeric'),
  type: z.enum(['percentage', 'amount']),
  value: z.number().positive('Value must be positive'),
  maxUses: z.number().int().positive().optional(),
  minPurchaseAmount: z.number().positive().optional(),
  maxDiscountAmount: z.number().positive().optional(),
  expiresAt: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
});

export type CreateDiscountCodeInput = z.infer<typeof createDiscountCodeSchema>;

/**
 * Update Discount Code Schema
 */
export const updateDiscountCodeSchema = z.object({
  maxUses: z.number().int().positive().optional().nullable(),
  minPurchaseAmount: z.number().positive().optional().nullable(),
  maxDiscountAmount: z.number().positive().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateDiscountCodeInput = z.infer<typeof updateDiscountCodeSchema>;

/**
 * Discount Code ID Params Schema
 */
export const discountCodeIdParamsSchema = z.object({
  codeId: z.string().uuid('Invalid discount code ID'),
});

export type DiscountCodeIdParams = z.infer<typeof discountCodeIdParamsSchema>;

// ============================================================================
// PRICING RULES
// ============================================================================

/**
 * Create Pricing Rule Schema
 */
export const createPricingRuleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  ruleType: z.enum(['early_bird', 'last_minute', 'quantity_based', 'time_based']),
  conditions: z.record(z.any()).default({}), // Flexible JSON conditions
  adjustmentType: z.enum(['percentage', 'fixed']),
  adjustmentValue: z.number().positive('Adjustment value must be positive'),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export type CreatePricingRuleInput = z.infer<typeof createPricingRuleSchema>;

/**
 * Update Pricing Rule Schema
 */
export const updatePricingRuleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  conditions: z.record(z.any()).optional(),
  adjustmentType: z.enum(['percentage', 'fixed']).optional(),
  adjustmentValue: z.number().positive().optional(),
  validFrom: z.coerce.date().optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePricingRuleInput = z.infer<typeof updatePricingRuleSchema>;

/**
 * Pricing Rule ID Params Schema
 */
export const pricingRuleIdParamsSchema = z.object({
  ruleId: z.string().uuid('Invalid pricing rule ID'),
});

export type PricingRuleIdParams = z.infer<typeof pricingRuleIdParamsSchema>;

// ============================================================================
// SHARED
// ============================================================================

/**
 * Event ID Params Schema
 */
export const eventIdParamsSchema = z.object({
  id: z.string().uuid('Invalid event ID'),
});

export type EventIdParams = z.infer<typeof eventIdParamsSchema>;
