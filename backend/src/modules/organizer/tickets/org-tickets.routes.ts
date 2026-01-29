import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { orgTicketsService } from './org-tickets.service.js';
import {
  createTicketTypeSchema,
  updateTicketTypeSchema,
  eventIdParamsSchema,
  ticketTypeIdParamsSchema,
  type CreateTicketTypeInput,
  type UpdateTicketTypeInput,
  type EventIdParams,
  type TicketTypeIdParams,
} from './org-tickets.schema.js';
import {
  requireAuth,
  requireOrganizer,
  requireEventOwnership,
  requireTicketTypeOwnership,
} from '../../../shared/middleware/index.js';
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
 * Organizer Ticket Types Routes
 * Part of /api/v1/org
 */
export async function orgTicketsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /org/events/:id/ticket-types
   * Get ticket types for an event
   */
  app.get(
    '/events/:id/ticket-types',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams>(eventIdParamsSchema, request.params);
      const ticketTypes = await orgTicketsService.getTicketTypes(organizerId, id);

      return reply.send({
        success: true,
        data: ticketTypes,
      });
    }
  );

  /**
   * POST /org/events/:id/ticket-types
   * Create ticket type for an event
   */
  app.post(
    '/events/:id/ticket-types',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams>(eventIdParamsSchema, request.params);
      const data = validate<CreateTicketTypeInput>(createTicketTypeSchema, request.body);
      const ticketType = await orgTicketsService.createTicketType(organizerId, id, data);

      return reply.status(201).send({
        success: true,
        data: ticketType,
      });
    }
  );

  /**
   * PATCH /org/ticket-types/:id
   * Update ticket type
   */
  app.patch(
    '/ticket-types/:id',
    { preHandler: [requireAuth, requireOrganizer, requireTicketTypeOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<TicketTypeIdParams>(ticketTypeIdParamsSchema, request.params);
      const data = validate<UpdateTicketTypeInput>(updateTicketTypeSchema, request.body);
      const ticketType = await orgTicketsService.updateTicketType(organizerId, id, data);

      return reply.send({
        success: true,
        data: ticketType,
      });
    }
  );

  /**
   * DELETE /org/ticket-types/:id
   * Delete ticket type
   */
  app.delete(
    '/ticket-types/:id',
    { preHandler: [requireAuth, requireOrganizer, requireTicketTypeOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<TicketTypeIdParams>(ticketTypeIdParamsSchema, request.params);
      await orgTicketsService.deleteTicketType(organizerId, id);

      return reply.status(204).send();
    }
  );
}
