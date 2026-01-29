import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ZodType, ZodTypeDef } from 'zod';
import { analyticsService } from './analytics.service.js';
import {
  eventIdParamsSchema,
  overviewQuerySchema,
  timeseriesQuerySchema,
  topSourcesQuerySchema,
  type EventIdParams,
  type OverviewQuery,
  type TimeseriesQuery,
  type TopSourcesQuery,
} from './analytics.schema.js';
import { requireAuth, requireOrganizer, requireEventOwnership } from '../../../shared/middleware/index.js';
import { ValidationError } from '../../../shared/utils/errors.js';

/**
 * Helper to validate with Zod - properly infers output type
 */
function validate<Output, Def extends ZodTypeDef, Input>(
  schema: ZodType<Output, Def, Input>,
  data: unknown
): Output {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.flatten().fieldErrors);
  }
  return result.data;
}

/**
 * Analytics Routes
 * Prefix: /api/v1/org/analytics
 */
export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /org/analytics/overview
   * Get organizer analytics overview
   */
  app.get(
    '/analytics/overview',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const query = validate<OverviewQuery, ZodTypeDef, unknown>(overviewQuerySchema, request.query);
      const result = await analyticsService.getOverview(organizerId, query);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * GET /org/analytics/events/:id/timeseries
   * Get time series metrics for an event
   */
  app.get(
    '/analytics/events/:id/timeseries',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams, ZodTypeDef, unknown>(eventIdParamsSchema, request.params);
      const query = validate<TimeseriesQuery, ZodTypeDef, unknown>(timeseriesQuerySchema, request.query);
      const result = await analyticsService.getTimeSeries(organizerId, id, query);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * GET /org/analytics/events/:id/conversion
   * Get conversion funnel for an event
   */
  app.get(
    '/analytics/events/:id/conversion',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams, ZodTypeDef, unknown>(eventIdParamsSchema, request.params);
      const result = await analyticsService.getConversionFunnel(organizerId, id);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * GET /org/analytics/events/:id/audience
   * Get audience breakdown for an event
   */
  app.get(
    '/analytics/events/:id/audience',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams, ZodTypeDef, unknown>(eventIdParamsSchema, request.params);
      const result = await analyticsService.getAudienceStats(organizerId, id);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * GET /org/analytics/events/:id/top-sources
   * Get top traffic sources for an event
   */
  app.get(
    '/analytics/events/:id/top-sources',
    { preHandler: [requireAuth, requireOrganizer, requireEventOwnership] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate<EventIdParams, ZodTypeDef, unknown>(eventIdParamsSchema, request.params);
      const query = validate<TopSourcesQuery, ZodTypeDef, unknown>(topSourcesQuerySchema, request.query);
      const result = await analyticsService.getTopSources(organizerId, id, query);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );
}
