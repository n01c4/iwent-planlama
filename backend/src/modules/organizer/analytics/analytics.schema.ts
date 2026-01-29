import { z } from 'zod';

// =============================================================================
// ANALYTICS SCHEMAS - Faz 6
// =============================================================================

/**
 * Event ID params
 */
export const eventIdParamsSchema = z.object({
  id: z.string().uuid(),
});
export type EventIdParams = z.infer<typeof eventIdParamsSchema>;

/**
 * Analytics overview query
 */
export const overviewQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
});
export type OverviewQuery = z.output<typeof overviewQuerySchema>;

/**
 * Time series query
 */
export const timeseriesQuerySchema = z.object({
  metric: z.enum(['revenue', 'tickets', 'views']).default('revenue'),
  range: z.enum(['7d', '30d', '90d']).default('30d'),
});
export type TimeseriesQuery = z.output<typeof timeseriesQuerySchema>;

/**
 * Top sources query
 */
export const topSourcesQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d']).default('30d'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type TopSourcesQuery = z.output<typeof topSourcesQuerySchema>;
