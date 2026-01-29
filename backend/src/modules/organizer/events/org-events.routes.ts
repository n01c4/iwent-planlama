import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { orgEventsService } from './org-events.service.js';
import {
  orgEventsQuerySchema,
  createEventSchema,
  updateEventSchema,
  eventIdParamsSchema,
  type OrgEventsQueryInput,
  type CreateEventInput,
  type UpdateEventInput,
  type EventIdParams,
} from './org-events.schema.js';
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
 * Organizer Events Routes
 * Prefix: /api/v1/org/events
 */
export async function orgEventsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /org/events
   * Get organizer's events
   */
  app.get(
    '/',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const query = validate<OrgEventsQueryInput>(orgEventsQuerySchema, request.query);
      const result = await orgEventsService.getEvents(organizerId, query);

      return reply.send({
        success: true,
        data: result.items,
        meta: result.meta,
      });
    }
  );

  /**
   * POST /org/events
   * Create new event (draft)
   */
  app.post(
    '/',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const data = validate<CreateEventInput>(createEventSchema, request.body);
      const event = await orgEventsService.createEvent(organizerId, data);

      return reply.status(201).send({
        success: true,
        data: event,
      });
    }
  );

  /**
   * GET /org/events/:id
   * Get event details
   */
  app.get(
    '/:id',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams>(eventIdParamsSchema, request.params);
      const event = await orgEventsService.getEventById(organizerId, id);

      return reply.send({
        success: true,
        data: event,
      });
    }
  );

  /**
   * PUT /org/events/:id
   * Update event
   */
  app.put(
    '/:id',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams>(eventIdParamsSchema, request.params);
      const data = validate<UpdateEventInput>(updateEventSchema, request.body);
      const event = await orgEventsService.updateEvent(organizerId, id, data);

      return reply.send({
        success: true,
        data: event,
      });
    }
  );

  /**
   * DELETE /org/events/:id
   * Delete event (soft delete)
   */
  app.delete(
    '/:id',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams>(eventIdParamsSchema, request.params);
      await orgEventsService.deleteEvent(organizerId, id);

      return reply.status(204).send();
    }
  );

  /**
   * POST /org/events/:id/publish
   * Publish event
   */
  app.post(
    '/:id/publish',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams>(eventIdParamsSchema, request.params);
      const event = await orgEventsService.publishEvent(organizerId, id);

      return reply.send({
        success: true,
        data: event,
      });
    }
  );

  /**
   * POST /org/events/:id/unpublish
   * Unpublish event
   */
  app.post(
    '/:id/unpublish',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams>(eventIdParamsSchema, request.params);
      const event = await orgEventsService.unpublishEvent(organizerId, id);

      return reply.send({
        success: true,
        data: event,
      });
    }
  );

  /**
   * POST /org/events/:id/duplicate
   * Duplicate event
   */
  app.post(
    '/:id/duplicate',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams>(eventIdParamsSchema, request.params);
      const event = await orgEventsService.duplicateEvent(organizerId, id);

      return reply.status(201).send({
        success: true,
        data: event,
      });
    }
  );
}
