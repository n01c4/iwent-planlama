import { z } from 'zod';

// =============================================================================
// CHECK-IN SCHEMAS - Faz 6
// =============================================================================

/**
 * Event ID params
 */
export const eventIdParamsSchema = z.object({
  id: z.string().uuid(),
});
export type EventIdParams = z.infer<typeof eventIdParamsSchema>;

/**
 * Attendees query
 */
export const attendeesQuerySchema = z.object({
  search: z.string().optional(),
  checkedIn: z.preprocess(
    (val) => val === 'true' ? true : val === 'false' ? false : undefined,
    z.boolean().optional()
  ),
  ticketType: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type AttendeesQuery = z.output<typeof attendeesQuerySchema>;

/**
 * Single check-in request
 */
export const singleCheckinSchema = z.object({
  ticketId: z.string().uuid().optional(),
  code: z.string().min(1).optional(),
}).refine(
  (data) => data.ticketId || data.code,
  { message: 'Either ticketId or code is required' }
);
export type SingleCheckinInput = z.infer<typeof singleCheckinSchema>;

/**
 * Bulk check-in request
 */
export const bulkCheckinSchema = z.object({
  codes: z.array(z.string().min(1)).min(1).max(100),
});
export type BulkCheckinInput = z.infer<typeof bulkCheckinSchema>;
