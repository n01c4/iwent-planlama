import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { venuesService } from './venues.service.js';
import {
  venuesQuerySchema,
  venueIdParamsSchema,
  venueSlugParamsSchema,
  venueEventsQuerySchema,
  type VenuesQueryInput,
  type VenueIdParams,
  type VenueSlugParams,
  type VenueEventsQueryInput,
} from './venues.schema.js';
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
 * Venues Routes
 * Prefix: /api/v1/venues
 */
export async function venuesRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /venues
   * Get paginated list of venues
   */
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = validate<VenuesQueryInput>(venuesQuerySchema, request.query);
    const result = await venuesService.getVenues(query);

    return reply.send({
      success: true,
      data: result.items,
      meta: result.meta,
    });
  });

  /**
   * GET /venues/:id
   * Get venue by ID
   */
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as Record<string, string>;

    // Check if it's a UUID (id) or slug
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(params.id)) {
      const { id } = validate<VenueIdParams>(venueIdParamsSchema, params);
      const venue = await venuesService.getVenueById(id);
      return reply.send({
        success: true,
        data: venue,
      });
    } else {
      // Treat as slug
      const venue = await venuesService.getVenueBySlug(params.id);
      return reply.send({
        success: true,
        data: venue,
      });
    }
  });

  /**
   * GET /venues/slug/:slug
   * Get venue by slug (explicit route)
   */
  app.get('/slug/:slug', async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = validate<VenueSlugParams>(venueSlugParamsSchema, request.params);
    const venue = await venuesService.getVenueBySlug(slug);

    return reply.send({
      success: true,
      data: venue,
    });
  });

  /**
   * GET /venues/:id/events
   * Get events at a venue
   */
  app.get('/:id/events', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = validate<VenueIdParams>(venueIdParamsSchema, request.params);
    const query = validate<VenueEventsQueryInput>(venueEventsQuerySchema, request.query);
    const result = await venuesService.getVenueEvents(id, query);

    return reply.send({
      success: true,
      data: result.items,
      meta: result.meta,
    });
  });

  /**
   * GET /venues/status
   * Module status endpoint
   */
  app.get('/status', async () => ({
    module: 'venues',
    status: 'active',
    endpoints: [
      'GET /',
      'GET /:id',
      'GET /slug/:slug',
      'GET /:id/events',
    ],
  }));
}
