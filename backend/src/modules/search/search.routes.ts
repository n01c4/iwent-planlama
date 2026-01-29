import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { searchService } from './search.service.js';
import { searchQuerySchema, type SearchQueryInput } from './search.schema.js';
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
 * Search Routes
 * Prefix: /api/v1/search
 */
export async function searchRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /search
   * Search across events, venues, and artists
   */
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = validate<SearchQueryInput>(searchQuerySchema, request.query);
    const results = await searchService.search(query);

    return reply.send({
      success: true,
      data: results,
    });
  });

  /**
   * GET /search/status
   * Module status endpoint
   */
  app.get('/status', async () => ({
    module: 'search',
    status: 'active',
    endpoints: [
      'GET /?q=&type=&limit=&city=',
    ],
  }));
}
