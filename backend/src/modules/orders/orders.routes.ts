import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ordersService } from './orders.service.js';
import {
  createOrderSchema,
  orderIdParamsSchema,
  userOrdersQuerySchema,
  type CreateOrderInput,
  type OrderIdParams,
  type UserOrdersQueryInput,
} from './orders.schema.js';
import { requireAuth } from '../../shared/middleware/index.js';
import { ValidationError } from '../../shared/utils/errors.js';

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
 * Orders Routes
 * Prefix: /api/v1/orders
 */
export async function ordersRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /orders
   * Create a new order
   */
  app.post(
    '/',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.sub;
      const data = validate<CreateOrderInput>(createOrderSchema, request.body);
      const order = await ordersService.createOrder(userId, data);

      return reply.status(201).send({
        success: true,
        data: order,
      });
    }
  );

  /**
   * GET /orders/:id
   * Get order details
   */
  app.get(
    '/:id',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.sub;
      const { id } = validate<OrderIdParams>(orderIdParamsSchema, request.params);
      const order = await ordersService.getOrderById(userId, id);

      return reply.send({
        success: true,
        data: order,
      });
    }
  );

  /**
   * POST /orders/:id/cancel
   * Cancel a pending order
   */
  app.post(
    '/:id/cancel',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.sub;
      const { id } = validate<OrderIdParams>(orderIdParamsSchema, request.params);
      await ordersService.cancelOrder(userId, id);

      return reply.status(204).send();
    }
  );
}

/**
 * User Orders Routes (under /users/me)
 */
export async function userOrdersRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /users/me/orders
   * Get current user's orders
   */
  app.get(
    '/orders',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.sub;
      const query = validate<UserOrdersQueryInput>(userOrdersQuerySchema, request.query);
      const result = await ordersService.getUserOrders(userId, query);

      return reply.send({
        success: true,
        data: result.items,
        meta: result.meta,
      });
    }
  );
}
