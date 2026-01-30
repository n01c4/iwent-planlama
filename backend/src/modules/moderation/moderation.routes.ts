import type { FastifyInstance } from 'fastify';
import { moderationService } from './moderation.service.js';
import {
  reportsQuerySchema,
  reportIdParamsSchema,
  reportActionSchema,
  chatsQuerySchema,
  chatIdParamsSchema,
  chatMessagesQuerySchema,
  chatActionSchema,
  updateFiltersSchema,
  createReportSchema,
  type ReportsQuery,
  type ReportIdParams,
  type ReportActionInput,
  type ChatsQuery,
  type ChatIdParams,
  type ChatMessagesQuery,
  type ChatActionInput,
  type UpdateFiltersInput,
  type CreateReportInput,
} from './moderation.schema.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { requireOrganizer } from '../../shared/middleware/organizer.middleware.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/utils/errors.js';
import type { ZodType, ZodTypeDef } from 'zod';

// Helper to validate Zod schemas
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
 * Moderation routes for organizers
 * Prefix: /api/v1/org/moderation
 */
export async function moderationRoutes(fastify: FastifyInstance): Promise<void> {
  // ===========================================================================
  // REPORTS
  // ===========================================================================

  /**
   * GET /moderation/reports - Get reports list
   */
  fastify.get<{ Querystring: ReportsQuery }>(
    '/reports',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request, reply) => {
      const organizerId = (request as any).organizer.id;
      const query = validate(reportsQuerySchema, request.query);

      const result = await moderationService.getReports(organizerId, query);

      return reply.send(successResponse(result.items, result.meta));
    }
  );

  /**
   * GET /moderation/reports/:id - Get single report
   */
  fastify.get<{ Params: ReportIdParams }>(
    '/reports/:id',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request, reply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate(reportIdParamsSchema, request.params);

      const report = await moderationService.getReport(organizerId, id);

      return reply.send(successResponse(report));
    }
  );

  /**
   * POST /moderation/reports/:id/action - Take action on report
   */
  fastify.post<{ Params: ReportIdParams; Body: ReportActionInput }>(
    '/reports/:id/action',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request, reply) => {
      const organizerId = (request as any).organizer.id;
      const userId = request.user!.sub;
      const { id } = validate(reportIdParamsSchema, request.params);
      const body = validate(reportActionSchema, request.body);

      await moderationService.takeReportAction(organizerId, userId, id, body);

      return reply.send(successResponse({ message: 'Action taken successfully' }));
    }
  );

  // ===========================================================================
  // CHAT MODERATION
  // ===========================================================================

  /**
   * GET /moderation/chats - Get event chats for moderation
   */
  fastify.get<{ Querystring: ChatsQuery }>(
    '/chats',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request, reply) => {
      const organizerId = (request as any).organizer.id;
      const query = validate(chatsQuerySchema, request.query);

      const result = await moderationService.getChats(organizerId, query);

      return reply.send(successResponse(result.items, result.meta));
    }
  );

  /**
   * GET /moderation/chats/:id/messages - Get chat messages
   */
  fastify.get<{ Params: ChatIdParams; Querystring: ChatMessagesQuery }>(
    '/chats/:id/messages',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request, reply) => {
      const organizerId = (request as any).organizer.id;
      const { id } = validate(chatIdParamsSchema, request.params);
      const query = validate(chatMessagesQuerySchema, request.query);

      const result = await moderationService.getChatMessages(organizerId, id, query);

      return reply.send(successResponse(result.items, result.meta));
    }
  );

  /**
   * POST /moderation/chats/:id/action - Take action on chat
   */
  fastify.post<{ Params: ChatIdParams; Body: ChatActionInput }>(
    '/chats/:id/action',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request, reply) => {
      const organizerId = (request as any).organizer.id;
      const userId = request.user!.sub;
      const { id } = validate(chatIdParamsSchema, request.params);
      const body = validate(chatActionSchema, request.body);

      const result = await moderationService.takeChatAction(organizerId, userId, id, body);

      return reply.send(successResponse(result));
    }
  );

  // ===========================================================================
  // FILTERS
  // ===========================================================================

  /**
   * GET /moderation/filters - Get moderation filters
   */
  fastify.get(
    '/filters',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request, reply) => {
      const organizerId = (request as any).organizer.id;

      const filters = await moderationService.getFilters(organizerId);

      return reply.send(successResponse(filters));
    }
  );

  /**
   * POST /moderation/filters - Update moderation filters
   */
  fastify.post<{ Body: UpdateFiltersInput }>(
    '/filters',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request, reply) => {
      const organizerId = (request as any).organizer.id;
      const body = validate(updateFiltersSchema, request.body);

      const filters = await moderationService.updateFilters(organizerId, body);

      return reply.send(successResponse(filters));
    }
  );
}

/**
 * User report creation route
 * This is added to users routes
 */
export async function userReportRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /users/me/reports - Create a report
   */
  fastify.post<{ Body: CreateReportInput }>(
    '/me/reports',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const body = validate(createReportSchema, request.body);

      const result = await moderationService.createReport(userId, body);

      return reply.status(201).send(successResponse(result));
    }
  );
}
