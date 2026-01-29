import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { artistsService } from './artists.service.js';
import {
  artistsQuerySchema,
  artistIdParamsSchema,
  artistSlugParamsSchema,
  artistEventsQuerySchema,
  type ArtistsQueryInput,
  type ArtistIdParams,
  type ArtistSlugParams,
  type ArtistEventsQueryInput,
} from './artists.schema.js';
import { ValidationError } from '../../shared/utils/errors.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';

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
 * Artists Routes
 * Prefix: /api/v1/artists
 */
export async function artistsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /artists
   * Get paginated list of artists
   */
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = validate<ArtistsQueryInput>(artistsQuerySchema, request.query);
    const result = await artistsService.getArtists(query);

    return reply.send({
      success: true,
      data: result.items,
      meta: result.meta,
    });
  });

  /**
   * GET /artists/:id
   * Get artist by ID
   */
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as Record<string, string>;

    // Check if it's a UUID (id) or slug
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(params.id)) {
      const { id } = validate<ArtistIdParams>(artistIdParamsSchema, params);
      const artist = await artistsService.getArtistById(id);
      return reply.send({
        success: true,
        data: artist,
      });
    } else {
      // Treat as slug
      const artist = await artistsService.getArtistBySlug(params.id);
      return reply.send({
        success: true,
        data: artist,
      });
    }
  });

  /**
   * GET /artists/slug/:slug
   * Get artist by slug (explicit route)
   */
  app.get('/slug/:slug', async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = validate<ArtistSlugParams>(artistSlugParamsSchema, request.params);
    const artist = await artistsService.getArtistBySlug(slug);

    return reply.send({
      success: true,
      data: artist,
    });
  });

  /**
   * GET /artists/:id/events
   * Get events featuring an artist
   */
  app.get('/:id/events', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = validate<ArtistIdParams>(artistIdParamsSchema, request.params);
    const query = validate<ArtistEventsQueryInput>(artistEventsQuerySchema, request.query);
    const result = await artistsService.getArtistEvents(id, query);

    return reply.send({
      success: true,
      data: result.items,
      meta: result.meta,
    });
  });

  // ===========================================================================
  // FOLLOWING ENDPOINTS (Faz 5)
  // ===========================================================================

  /**
   * POST /artists/:id/follow
   * Follow an artist
   */
  app.post(
    '/:id/follow',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user!.sub;
      const { id: artistId } = validate<ArtistIdParams>(artistIdParamsSchema, request.params);

      const result = await artistsService.followArtist(userId, artistId);

      return reply.send({
        success: true,
        data: {
          message: 'Artist followed',
          followerCount: result.followerCount,
        },
      });
    }
  );

  /**
   * DELETE /artists/:id/follow
   * Unfollow an artist
   */
  app.delete(
    '/:id/follow',
    { preHandler: [requireAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user!.sub;
      const { id: artistId } = validate<ArtistIdParams>(artistIdParamsSchema, request.params);

      await artistsService.unfollowArtist(userId, artistId);

      return reply.status(204).send();
    }
  );

  /**
   * GET /artists/status
   * Module status endpoint
   */
  app.get('/status', async () => ({
    module: 'artists',
    status: 'active',
    endpoints: [
      'GET /',
      'GET /:id',
      'GET /slug/:slug',
      'GET /:id/events',
      'POST /:id/follow',
      'DELETE /:id/follow',
    ],
  }));
}
