import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eventsService } from './events.service.js';
import {
  eventsQuerySchema,
  eventIdParamsSchema,
  eventSlugParamsSchema,
  eventAttendeesQuerySchema,
  type EventsQueryInput,
  type EventIdParams,
  type EventSlugParams,
  type EventAttendeesQueryInput,
} from './events.schema.js';
import { ValidationError } from '../../shared/utils/errors.js';
import { optionalAuth } from '../../shared/middleware/auth.middleware.js';

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
 * Events Routes
 * Prefix: /api/v1/events
 */
export async function eventsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /events
   * Get paginated list of events with filters
   */
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = validate<EventsQueryInput>(eventsQuerySchema, request.query);
    const result = await eventsService.getEvents(query);

    return reply.send({
      success: true,
      data: result.items,
      meta: result.meta,
    });
  });

  /**
   * GET /events/:id
   * Get event by ID
   */
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as Record<string, string>;

    // Check if it's a UUID (id) or slug
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(params.id)) {
      const { id } = validate<EventIdParams>(eventIdParamsSchema, params);
      const event = await eventsService.getEventById(id);
      return reply.send({
        success: true,
        data: event,
      });
    } else {
      // Treat as slug
      const event = await eventsService.getEventBySlug(params.id);
      return reply.send({
        success: true,
        data: event,
      });
    }
  });

  /**
   * GET /events/slug/:slug
   * Get event by slug (explicit route)
   */
  app.get('/slug/:slug', async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = validate<EventSlugParams>(eventSlugParamsSchema, request.params);
    const event = await eventsService.getEventBySlug(slug);

    return reply.send({
      success: true,
      data: event,
    });
  });

  /**
   * GET /events/:id/ticket-types
   * Get ticket types for an event
   */
  app.get('/:id/ticket-types', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = validate<EventIdParams>(eventIdParamsSchema, request.params);
    const ticketTypes = await eventsService.getEventTicketTypes(id);

    return reply.send({
      success: true,
      data: ticketTypes,
    });
  });

  // ===========================================================================
  // SOCIAL ENDPOINTS (Faz 5)
  // ===========================================================================

  /**
   * GET /events/:id/attendees
   * Get event attendees
   */
  app.get(
    '/:id/attendees',
    { preHandler: [optionalAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id: eventId } = validate<EventIdParams>(eventIdParamsSchema, request.params);
      const query = validate<EventAttendeesQueryInput>(eventAttendeesQuerySchema, request.query);
      const viewerId = request.user?.sub || null;

      const result = await eventsService.getEventAttendees(eventId, viewerId, query);

      return reply.send({
        success: true,
        data: result.items,
        meta: result.meta,
      });
    }
  );

  /**
   * GET /events/:id/social
   * Get event social info
   */
  app.get(
    '/:id/social',
    { preHandler: [optionalAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id: eventId } = validate<EventIdParams>(eventIdParamsSchema, request.params);
      const viewerId = request.user?.sub || null;

      const result = await eventsService.getEventSocial(eventId, viewerId);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * GET /events/status
   * Module status endpoint
   */
  app.get('/status', async () => ({
    module: 'events',
    status: 'active',
    endpoints: [
      'GET /',
      'GET /:id',
      'GET /slug/:slug',
      'GET /:id/ticket-types',
      'GET /:id/attendees',
      'GET /:id/social',
    ],
  }));
}
