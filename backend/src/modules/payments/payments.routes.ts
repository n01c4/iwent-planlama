import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { paymentsService } from './payments.service.js';
import {
  createPaymentIntentSchema,
  confirmOrderPaymentSchema,
  mockCheckoutSchema,
  intentIdParamsSchema,
  orderIdParamsSchema,
  type CreatePaymentIntentInput,
  type ConfirmOrderPaymentInput,
  type MockCheckoutInput,
  type IntentIdParams,
  type OrderIdParams,
} from './payments.schema.js';
import { requireAuth } from '../../shared/middleware/index.js';
import { ValidationError } from '../../shared/utils/errors.js';
import { isMockPaymentEnabled } from './payments.config.js';

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
 * Payments Routes
 * Prefix: /api/v1/payments
 */
export async function paymentsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /payments/intent
   * Create a payment intent for an order
   */
  app.post(
    '/intent',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.sub;
      const data = validate<CreatePaymentIntentInput>(createPaymentIntentSchema, request.body);
      const intent = await paymentsService.createPaymentIntent(userId, data);

      return reply.send({
        success: true,
        data: intent,
      });
    }
  );

  /**
   * POST /payments/confirm/:id
   * Confirm payment for an order
   */
  app.post(
    '/confirm/:id',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.sub;
      const { id } = validate<OrderIdParams>(orderIdParamsSchema, request.params);
      const data = validate<ConfirmOrderPaymentInput>(confirmOrderPaymentSchema, request.body);
      const result = await paymentsService.confirmPayment(userId, id, data);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * POST /payments/mock-checkout/:intentId
   * Mock checkout endpoint (development only)
   */
  app.post(
    '/mock-checkout/:intentId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!isMockPaymentEnabled()) {
        return reply.status(403).send({
          success: false,
          error: 'Mock payments are not enabled',
        });
      }

      const { intentId } = validate<IntentIdParams>(intentIdParamsSchema, request.params);
      const data = validate<MockCheckoutInput>(mockCheckoutSchema, request.body);
      const result = await paymentsService.handleMockCheckout(intentId, data.action);

      return reply.send({
        success: result.success,
        data: result,
      });
    }
  );

  /**
   * POST /payments/webhook
   * Handle payment provider webhooks
   */
  app.post(
    '/webhook',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const signature = request.headers['x-signature'] as string | undefined;
      const result = await paymentsService.handleWebhook(request.body, signature);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );
}
