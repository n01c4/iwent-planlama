import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { orgVenuesService } from './org-venues.service.js';
import {
  createVenueSchema,
  updateVenueSchema,
  venueIdParamsSchema,
  orgVenuesQuerySchema,
  type CreateVenueInput,
  type UpdateVenueInput,
  type VenueIdParams,
  type OrgVenuesQueryInput,
} from './org-venues.schema.js';
import { requireAuth, requireOrganizer, requireVenueOwnership } from '../../../shared/middleware/index.js';
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
 * Organizer Venues Routes
 * Prefix: /api/v1/org/venues
 */
export async function orgVenuesRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /org/venues
   * Get organizer's venues
   */
  app.get(
    '/',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const query = validate<OrgVenuesQueryInput>(orgVenuesQuerySchema, request.query);
      const venues = await orgVenuesService.getVenues(organizerId, query);

      return reply.send({
        success: true,
        data: venues,
      });
    }
  );

  /**
   * POST /org/venues
   * Create venue
   */
  app.post(
    '/',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const data = validate<CreateVenueInput>(createVenueSchema, request.body);
      const venue = await orgVenuesService.createVenue(organizerId, data);

      return reply.status(201).send({
        success: true,
        data: venue,
      });
    }
  );

  /**
   * PUT /org/venues/:id
   * Update venue
   */
  app.put(
    '/:id',
    { preHandler: [requireAuth, requireOrganizer, requireVenueOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<VenueIdParams>(venueIdParamsSchema, request.params);
      const data = validate<UpdateVenueInput>(updateVenueSchema, request.body);
      const venue = await orgVenuesService.updateVenue(organizerId, id, data);

      return reply.send({
        success: true,
        data: venue,
      });
    }
  );

  /**
   * DELETE /org/venues/:id
   * Delete venue
   */
  app.delete(
    '/:id',
    { preHandler: [requireAuth, requireOrganizer, requireVenueOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<VenueIdParams>(venueIdParamsSchema, request.params);
      await orgVenuesService.deleteVenue(organizerId, id);

      return reply.status(204).send();
    }
  );
}
