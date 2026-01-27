import type { FastifyInstance } from 'fastify';

/**
 * Auth Routes
 * Prefix: /api/v1/auth
 *
 * Endpoints (to be implemented):
 * - POST /register
 * - POST /login
 * - POST /refresh
 * - POST /logout
 * - POST /password/forgot
 * - POST /password/reset
 * - POST /verify/email
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Placeholder route for testing
  app.get('/status', async () => ({
    module: 'auth',
    status: 'placeholder',
    endpoints: [
      'POST /register',
      'POST /login',
      'POST /refresh',
      'POST /logout',
      'POST /password/forgot',
      'POST /password/reset',
      'POST /verify/email',
    ],
  }));

  // TODO: Implement auth endpoints
  // app.post('/register', async (request, reply) => { ... });
  // app.post('/login', async (request, reply) => { ... });
  // etc.
}
