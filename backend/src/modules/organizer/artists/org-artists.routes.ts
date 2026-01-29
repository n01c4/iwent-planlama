import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { orgArtistsService } from './org-artists.service.js';
import {
  createArtistSchema,
  updateArtistSchema,
  artistIdParamsSchema,
  orgArtistsQuerySchema,
  type CreateArtistInput,
  type UpdateArtistInput,
  type ArtistIdParams,
  type OrgArtistsQueryInput,
} from './org-artists.schema.js';
import { requireAuth, requireOrganizer, requireArtistOwnership } from '../../../shared/middleware/index.js';
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
 * Organizer Artists Routes
 * Prefix: /api/v1/org/artists
 */
export async function orgArtistsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /org/artists
   * Get organizer's artists
   */
  app.get(
    '/',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const query = validate<OrgArtistsQueryInput>(orgArtistsQuerySchema, request.query);
      const artists = await orgArtistsService.getArtists(organizerId, query);

      return reply.send({
        success: true,
        data: artists,
      });
    }
  );

  /**
   * POST /org/artists
   * Create artist
   */
  app.post(
    '/',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const data = validate<CreateArtistInput>(createArtistSchema, request.body);
      const artist = await orgArtistsService.createArtist(organizerId, data);

      return reply.status(201).send({
        success: true,
        data: artist,
      });
    }
  );

  /**
   * PUT /org/artists/:id
   * Update artist
   */
  app.put(
    '/:id',
    { preHandler: [requireAuth, requireOrganizer, requireArtistOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<ArtistIdParams>(artistIdParamsSchema, request.params);
      const data = validate<UpdateArtistInput>(updateArtistSchema, request.body);
      const artist = await orgArtistsService.updateArtist(organizerId, id, data);

      return reply.send({
        success: true,
        data: artist,
      });
    }
  );

  /**
   * DELETE /org/artists/:id
   * Delete artist
   */
  app.delete(
    '/:id',
    { preHandler: [requireAuth, requireOrganizer, requireArtistOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<ArtistIdParams>(artistIdParamsSchema, request.params);
      await orgArtistsService.deleteArtist(organizerId, id);

      return reply.status(204).send();
    }
  );
}
