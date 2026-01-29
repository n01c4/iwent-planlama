import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ZodType, ZodTypeDef } from 'zod';
import { checkinService } from './checkin.service.js';
import {
  eventIdParamsSchema,
  attendeesQuerySchema,
  singleCheckinSchema,
  bulkCheckinSchema,
  type EventIdParams,
  type AttendeesQuery,
  type SingleCheckinInput,
  type BulkCheckinInput,
} from './checkin.schema.js';
import { requireAuth, requireOrganizer, requireEventOwnership } from '../../../shared/middleware/index.js';
import { ValidationError } from '../../../shared/utils/errors.js';

/**
 * Helper to validate with Zod - properly infers output type
 */
function validate<Output, Def extends ZodTypeDef, Input>(
  schema: ZodType<Output, Def, Input>,
  data: unknown
): Output {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.flatten().fieldErrors);
  }
  return result.data;
}

/**
 * Check-in Routes
 * Prefix: /api/v1/org/events/:id
 */
export async function checkinRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /org/events/:id/attendees
   * Get attendees list for an event
   */
  app.get(
    '/events/:id/attendees',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams, ZodTypeDef, unknown>(eventIdParamsSchema, request.params);
      const query = validate<AttendeesQuery, ZodTypeDef, unknown>(attendeesQuerySchema, request.query);
      const result = await checkinService.getAttendees(organizerId, id, query);

      return reply.send({
        success: true,
        data: result.items,
        meta: result.meta,
      });
    }
  );

  /**
   * POST /org/events/:id/checkin
   * Check-in a single ticket
   */
  app.post(
    '/events/:id/checkin',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const userId = (request as any).user.id;
      const { id } = validate<EventIdParams, ZodTypeDef, unknown>(eventIdParamsSchema, request.params);
      const input = validate<SingleCheckinInput, ZodTypeDef, unknown>(singleCheckinSchema, request.body);
      const result = await checkinService.checkin(organizerId, id, userId, input);

      return reply.send({
        success: result.success,
        data: result,
        message: result.message,
      });
    }
  );

  /**
   * POST /org/events/:id/checkin/bulk
   * Bulk check-in tickets (max 100)
   */
  app.post(
    '/events/:id/checkin/bulk',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const userId = (request as any).user.id;
      const { id } = validate<EventIdParams, ZodTypeDef, unknown>(eventIdParamsSchema, request.params);
      const input = validate<BulkCheckinInput, ZodTypeDef, unknown>(bulkCheckinSchema, request.body);
      const result = await checkinService.bulkCheckin(organizerId, id, userId, input);

      return reply.send({
        success: true,
        data: result,
        message: `Checked in ${result.successful} tickets, ${result.failed} failed`,
      });
    }
  );

  /**
   * DELETE /org/events/:id/checkin/:ticketId
   * Undo check-in for a ticket
   */
  app.delete(
    '/events/:id/checkin/:ticketId',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const params = request.params as { id: string; ticketId: string };
      const { id } = validate<EventIdParams, ZodTypeDef, unknown>(eventIdParamsSchema, { id: params.id });
      const ticketId = params.ticketId;
      const result = await checkinService.undoCheckin(organizerId, id, ticketId);

      return reply.send({
        success: true,
        data: result,
        message: result.message,
      });
    }
  );
}
