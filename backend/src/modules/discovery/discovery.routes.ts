import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { discoveryService } from './discovery.service.js';
import { optionalAuth } from '../../shared/middleware/index.js';

/**
 * Discovery Routes
 * Prefix: /api/v1/recommendations
 */
export async function discoveryRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /recommendations/discovery
   * Get personalized discovery feed
   */
  app.get('/discovery', {
    preHandler: [optionalAuth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    // Get city from query or user profile
    const query = request.query as { city?: string };
    let city = query.city;

    // If user is authenticated and no city in query, use their profile city
    if (!city && request.user) {
      // Could fetch user's city from profile here
      // For now, just use query param
    }

    const feed = await discoveryService.getDiscoveryFeed(city);

    return reply.send({
      success: true,
      data: feed,
    });
  });

  /**
   * GET /recommendations/status
   * Module status endpoint
   */
  app.get('/status', async () => ({
    module: 'discovery',
    status: 'active',
    endpoints: [
      'GET /discovery?city=',
    ],
  }));
}
