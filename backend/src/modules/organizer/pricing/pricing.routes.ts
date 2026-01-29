import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pricingService } from './pricing.service.js';
import {
  createDiscountCodeSchema,
  updateDiscountCodeSchema,
  discountCodeIdParamsSchema,
  createPricingRuleSchema,
  updatePricingRuleSchema,
  pricingRuleIdParamsSchema,
  eventIdParamsSchema,
  type CreateDiscountCodeInput,
  type UpdateDiscountCodeInput,
  type DiscountCodeIdParams,
  type CreatePricingRuleInput,
  type UpdatePricingRuleInput,
  type PricingRuleIdParams,
  type EventIdParams,
} from './pricing.schema.js';
import { requireAuth, requireOrganizer, requireEventOwnership } from '../../../shared/middleware/index.js';
import { ValidationError } from '../../../shared/utils/errors.js';

/**
 * Helper to validate with Zod
 */
function validate<T>(
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: { flatten: () => { fieldErrors: unknown } } } },
  data: unknown
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error?.flatten().fieldErrors);
  }
  return result.data as T;
}

/**
 * Pricing Routes (Discount Codes & Pricing Rules)
 * Prefix: /api/v1/org/events/:id
 */
export async function pricingRoutes(app: FastifyInstance): Promise<void> {
  // ==========================================================================
  // DISCOUNT CODES
  // ==========================================================================

  /**
   * GET /org/events/:id/discount-codes
   * Get discount codes for an event
   */
  app.get(
    '/events/:id/discount-codes',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams>(eventIdParamsSchema, request.params);
      const codes = await pricingService.getDiscountCodes(organizerId, id);

      return reply.send({
        success: true,
        data: codes,
      });
    }
  );

  /**
   * POST /org/events/:id/discount-codes
   * Create a discount code
   */
  app.post(
    '/events/:id/discount-codes',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams>(eventIdParamsSchema, request.params);
      const data = validate<CreateDiscountCodeInput>(createDiscountCodeSchema, request.body);
      const code = await pricingService.createDiscountCode(organizerId, id, data);

      return reply.status(201).send({
        success: true,
        data: code,
      });
    }
  );

  /**
   * PATCH /org/events/:id/discount-codes/:codeId
   * Update a discount code
   */
  app.patch(
    '/events/:id/discount-codes/:codeId',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const params = request.params as { id: string; codeId: string };
      const { id } = validate<EventIdParams>(eventIdParamsSchema, { id: params.id });
      const { codeId } = validate<DiscountCodeIdParams>(discountCodeIdParamsSchema, { codeId: params.codeId });
      const data = validate<UpdateDiscountCodeInput>(updateDiscountCodeSchema, request.body);
      const code = await pricingService.updateDiscountCode(organizerId, id, codeId, data);

      return reply.send({
        success: true,
        data: code,
      });
    }
  );

  /**
   * DELETE /org/events/:id/discount-codes/:codeId
   * Delete a discount code
   */
  app.delete(
    '/events/:id/discount-codes/:codeId',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const params = request.params as { id: string; codeId: string };
      const { id } = validate<EventIdParams>(eventIdParamsSchema, { id: params.id });
      const { codeId } = validate<DiscountCodeIdParams>(discountCodeIdParamsSchema, { codeId: params.codeId });
      await pricingService.deleteDiscountCode(organizerId, id, codeId);

      return reply.status(204).send();
    }
  );

  // ==========================================================================
  // PRICING RULES
  // ==========================================================================

  /**
   * GET /org/events/:id/pricing-rules
   * Get pricing rules for an event
   */
  app.get(
    '/events/:id/pricing-rules',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams>(eventIdParamsSchema, request.params);
      const rules = await pricingService.getPricingRules(organizerId, id);

      return reply.send({
        success: true,
        data: rules,
      });
    }
  );

  /**
   * POST /org/events/:id/pricing-rules
   * Create a pricing rule
   */
  app.post(
    '/events/:id/pricing-rules',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams>(eventIdParamsSchema, request.params);
      const data = validate<CreatePricingRuleInput>(createPricingRuleSchema, request.body);
      const rule = await pricingService.createPricingRule(organizerId, id, data);

      return reply.status(201).send({
        success: true,
        data: rule,
      });
    }
  );

  /**
   * PATCH /org/events/:id/pricing-rules/:ruleId
   * Update a pricing rule
   */
  app.patch(
    '/events/:id/pricing-rules/:ruleId',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const params = request.params as { id: string; ruleId: string };
      const { id } = validate<EventIdParams>(eventIdParamsSchema, { id: params.id });
      const { ruleId } = validate<PricingRuleIdParams>(pricingRuleIdParamsSchema, { ruleId: params.ruleId });
      const data = validate<UpdatePricingRuleInput>(updatePricingRuleSchema, request.body);
      const rule = await pricingService.updatePricingRule(organizerId, id, ruleId, data);

      return reply.send({
        success: true,
        data: rule,
      });
    }
  );

  /**
   * DELETE /org/events/:id/pricing-rules/:ruleId
   * Delete a pricing rule
   */
  app.delete(
    '/events/:id/pricing-rules/:ruleId',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const params = request.params as { id: string; ruleId: string };
      const { id } = validate<EventIdParams>(eventIdParamsSchema, { id: params.id });
      const { ruleId } = validate<PricingRuleIdParams>(pricingRuleIdParamsSchema, { ruleId: params.ruleId });
      await pricingService.deletePricingRule(organizerId, id, ruleId);

      return reply.status(204).send();
    }
  );
}
