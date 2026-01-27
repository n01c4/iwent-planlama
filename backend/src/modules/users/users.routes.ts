import type { FastifyInstance } from 'fastify';

/**
 * Users Routes
 * Prefix: /api/v1/users
 *
 * Endpoints (to be implemented):
 * - GET /me
 * - PATCH /me
 * - GET /me/tickets
 * - GET /me/orders
 * - GET /me/notifications
 * - POST /me/notifications (mark read)
 * - GET /me/calendar
 * - GET /:userId (public profile)
 */
export async function usersRoutes(app: FastifyInstance): Promise<void> {
  // Placeholder route for testing
  app.get('/status', async () => ({
    module: 'users',
    status: 'placeholder',
    endpoints: [
      'GET /me',
      'PATCH /me',
      'GET /me/tickets',
      'GET /me/orders',
      'GET /me/notifications',
      'POST /me/notifications',
      'GET /me/calendar',
      'GET /:userId',
    ],
  }));

  // TODO: Implement user endpoints
  // app.get('/me', { preHandler: [requireAuth] }, async (request, reply) => { ... });
  // app.patch('/me', { preHandler: [requireAuth] }, async (request, reply) => { ... });
  // etc.
}
