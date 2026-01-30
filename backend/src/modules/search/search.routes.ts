import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { searchService } from './search.service.js';
import {
  searchQuerySchema,
  naturalSearchSchema,
  type SearchQueryInput,
  type NaturalSearchInput,
} from './search.schema.js';
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
   * Search across events, venues, and artists (keyword-based)
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
   * POST /search/natural
   * AI-powered natural language search
   *
   * Example queries (Turkish):
   * - "Cuma akşamı İstanbul'da canlı müzik konserleri"
   * - "Bu hafta sonu İzmir'de açık hava etkinlikleri"
   * - "Gelecek ay Ankara'da stand-up gösterileri"
   * - "200 TL altında tiyatro bileti"
   *
   * Rate limit: 30 requests/minute (authenticated), 10 requests/minute (public)
   */
  app.post(
    '/natural',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute',
          keyGenerator: (request: FastifyRequest) => {
            return request.user?.sub || request.ip;
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const input = validate<NaturalSearchInput>(naturalSearchSchema, request.body);

      // Log the search query for monitoring
      request.log.info({
        event: 'nlp_search_request',
        query: input.query,
        userId: request.user?.sub || 'anonymous',
        userPreferences: input.userPreferences,
      });

      const results = await searchService.naturalSearch(input);

      // Log the response metadata
      request.log.info({
        event: 'nlp_search_response',
        query: input.query,
        userId: request.user?.sub || 'anonymous',
        resultsCount: results.total,
        fallbackUsed: results.metadata.fallbackUsed,
        responseTimeMs: results.metadata.responseTimeMs,
        parsedIntent: results.metadata.parsedIntent,
      });

      return reply.send({
        success: true,
        data: results,
      });
    }
  );

  /**
   * GET /search/status
   * Module status endpoint
   */
  app.get('/status', async () => ({
    module: 'search',
    status: 'active',
    endpoints: [
      'GET /?q=&type=&limit=&city=',
      'POST /natural - AI-powered NLP search',
    ],
    nlpSearchEnabled: true,
  }));
}
