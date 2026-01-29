import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { orgOrdersService } from './org-orders.service.js';
import {
  eventOrdersQuerySchema,
  eventIdParamsSchema,
  orderIdParamsSchema,
  refundOrderSchema,
  type EventOrdersQueryInput,
  type EventIdParams,
  type OrderIdParams,
  type RefundOrderInput,
} from './org-orders.schema.js';
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
 * Organizer Orders Routes
 * Prefix: /api/v1/org/events/:id/orders
 */
export async function orgOrdersRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /org/events/:id/orders
   * Get orders for an event
   */
  app.get(
    '/events/:id/orders',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams>(eventIdParamsSchema, request.params);
      const query = validate<EventOrdersQueryInput>(eventOrdersQuerySchema, request.query);
      const result = await orgOrdersService.getEventOrders(organizerId, id, query);

      return reply.send({
        success: true,
        data: result.items,
        meta: result.meta,
      });
    }
  );

  /**
   * GET /org/orders/:orderId
   * Get order details
   */
  app.get(
    '/orders/:orderId',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { orderId } = validate<OrderIdParams>(orderIdParamsSchema, request.params);
      const order = await orgOrdersService.getOrderById(organizerId, orderId);

      return reply.send({
        success: true,
        data: order,
      });
    }
  );

  /**
   * POST /org/events/:id/orders/:orderId/refund
   * Refund an order
   */
  app.post(
    '/events/:id/orders/:orderId/refund',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const params = request.params as { id: string; orderId: string };
      const { id: eventId } = validate<EventIdParams>(eventIdParamsSchema, { id: params.id });
      const { orderId } = validate<OrderIdParams>(orderIdParamsSchema, { orderId: params.orderId });
      const data = validate<RefundOrderInput>(refundOrderSchema, request.body);
      const order = await orgOrdersService.refundOrder(organizerId, eventId, orderId, data);

      return reply.send({
        success: true,
        data: order,
        message: 'Order refunded successfully',
      });
    }
  );
}
