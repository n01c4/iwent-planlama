import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { usersService } from './users.service.js';
import {
  updateProfileSchema,
  userParamsSchema,
  type UpdateProfileInput,
} from './users.schema.js';
import { followedArtistsQuerySchema, type FollowedArtistsQueryInput } from '../artists/artists.schema.js';
import { artistsService } from '../artists/artists.service.js';
import { requireAuth, optionalAuth } from '../../shared/middleware/index.js';
import { ValidationError } from '../../shared/utils/errors.js';

/**
 * Helper to validate request body/params with Zod
 */
function validate<T>(schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: { flatten: () => { fieldErrors: unknown } } } }, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error?.flatten().fieldErrors);
  }
  return result.data as T;
}

/**
 * Users Routes
 * Prefix: /api/v1/users
 */
export async function usersRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /users/me
   * Get current user's profile
   */
  app.get('/me', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const profile = await usersService.getProfile(request.user!.sub);

    return reply.send({
      success: true,
      data: profile,
    });
  });

  /**
   * PATCH /users/me
   * Update current user's profile
   */
  app.patch('/me', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const input = validate<UpdateProfileInput>(updateProfileSchema, request.body);
    const profile = await usersService.updateProfile(request.user!.sub, input);

    return reply.send({
      success: true,
      data: profile,
    });
  });

  /**
   * GET /users/me/tickets
   * Get current user's tickets (placeholder)
   */
  app.get('/me/tickets', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const tickets = await usersService.getUserTickets(request.user!.sub);

    return reply.send({
      success: true,
      data: tickets,
    });
  });

  /**
   * GET /users/me/orders
   * Get current user's orders (placeholder)
   */
  app.get('/me/orders', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const orders = await usersService.getUserOrders(request.user!.sub);

    return reply.send({
      success: true,
      data: orders,
    });
  });

  // Note: Notification endpoints are now handled by the notifications module
  // GET /users/me/notifications -> notifications.routes.ts
  // POST /users/me/notifications -> notifications.routes.ts

  /**
   * GET /users/me/calendar
   * Get current user's event calendar (placeholder)
   */
  app.get('/me/calendar', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const calendar = await usersService.getUserCalendar(request.user!.sub);

    return reply.send({
      success: true,
      data: calendar,
    });
  });

  /**
   * GET /users/me/following/artists
   * Get current user's followed artists (Faz 5)
   */
  app.get('/me/following/artists', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user!.sub;
    const query = validate<FollowedArtistsQueryInput>(followedArtistsQuerySchema, request.query);

    const result = await artistsService.getFollowedArtists(userId, query);

    return reply.send({
      success: true,
      data: result.items,
      meta: result.meta,
    });
  });

  /**
   * GET /users/:userId
   * Get public profile of another user
   */
  app.get('/:userId', {
    preHandler: [optionalAuth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { userId: string };
    const { userId } = validate<{ userId: string }>(userParamsSchema, params);
    const viewerId = request.user?.sub;

    const profile = await usersService.getPublicProfile(userId, viewerId);

    return reply.send({
      success: true,
      data: profile,
    });
  });

  /**
   * GET /users/status
   * Check users module status (for debugging)
   */
  app.get('/status', async () => ({
    module: 'users',
    status: 'active',
    endpoints: [
      'GET /me',
      'PATCH /me',
      'GET /me/tickets',
      'GET /me/orders',
      'GET /me/calendar',
      'GET /me/following/artists',
      'GET /:userId',
    ],
  }));
}
