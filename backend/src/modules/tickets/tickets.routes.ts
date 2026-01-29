import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ticketsService } from './tickets.service.js';
import {
  ticketIdParamsSchema,
  userTicketsQuerySchema,
  refundRequestSchema,
  transferTicketSchema,
  type TicketIdParams,
  type UserTicketsQueryInput,
  type RefundRequestInput,
  type TransferTicketInput,
} from './tickets.schema.js';
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
 * Tickets Routes
 * Prefix: /api/v1/tickets
 */
export async function ticketsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /tickets/:id
   * Get ticket details
   */
  app.get(
    '/:id',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.sub;
      const { id } = validate<TicketIdParams>(ticketIdParamsSchema, request.params);
      const ticket = await ticketsService.getTicketById(userId, id);

      return reply.send({
        success: true,
        data: ticket,
      });
    }
  );

  /**
   * POST /tickets/:id/refund
   * Request refund for a ticket
   */
  app.post(
    '/:id/refund',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.sub;
      const { id } = validate<TicketIdParams>(ticketIdParamsSchema, request.params);
      const data = validate<RefundRequestInput>(refundRequestSchema, request.body);
      const ticket = await ticketsService.requestRefund(userId, id, data);

      return reply.send({
        success: true,
        data: ticket,
        message: 'Refund request submitted. The organizer will review your request.',
      });
    }
  );

  /**
   * POST /tickets/:id/transfer
   * Transfer ticket to another user
   */
  app.post(
    '/:id/transfer',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.sub;
      const { id } = validate<TicketIdParams>(ticketIdParamsSchema, request.params);
      const data = validate<TransferTicketInput>(transferTicketSchema, request.body);
      const ticket = await ticketsService.transferTicket(userId, id, data);

      return reply.send({
        success: true,
        data: ticket,
        message: 'Ticket transferred successfully.',
      });
    }
  );
}

/**
 * User Tickets Routes (under /users/me)
 */
export async function userTicketsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /users/me/tickets
   * Get current user's tickets
   */
  app.get(
    '/tickets',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as any).user.sub;
      const query = validate<UserTicketsQueryInput>(userTicketsQuerySchema, request.query);
      const result = await ticketsService.getUserTickets(userId, query);

      return reply.send({
        success: true,
        data: result.items,
        meta: result.meta,
      });
    }
  );
}
