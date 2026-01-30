import type { FastifyInstance } from 'fastify';
import { notificationsService } from './notifications.service.js';
import { broadcastService } from './broadcast.service.js';
import {
  notificationsQuerySchema,
  markReadSchema,
  broadcastSchema,
  type NotificationsQuery,
  type MarkReadInput,
  type BroadcastInput,
} from './notifications.schema.js';
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

export async function notificationsRoutes(fastify: FastifyInstance): Promise<void> {
  // ===========================================================================
  // USER NOTIFICATION ENDPOINTS
  // ===========================================================================

  /**
   * GET /users/me/notifications - Get user's notifications
   */
  fastify.get<{ Querystring: NotificationsQuery }>(
    '/me/notifications',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const query = validate(notificationsQuerySchema, request.query);

      const result = await notificationsService.getNotifications(userId, query);

      return reply.send(successResponse(result.items, result.meta));
    }
  );

  /**
   * POST /users/me/notifications - Mark notifications as read
   */
  fastify.post<{ Body: MarkReadInput }>(
    '/me/notifications',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const body = validate(markReadSchema, request.body);

      const result = await notificationsService.markAsRead(userId, body);

      return reply.send(successResponse({ updated: result.updated }));
    }
  );

  /**
   * GET /users/me/notifications/count - Get unread notification count
   */
  fastify.get(
    '/me/notifications/count',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;

      const count = await notificationsService.getUnreadCount(userId);

      return reply.send(successResponse({ unreadCount: count }));
    }
  );
}

/**
 * Broadcast routes - for organizers
 * Registered under /api/v1/notifications
 */
export async function broadcastRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /notifications/broadcast - Send broadcast to event attendees
   */
  fastify.post<{ Body: BroadcastInput }>(
    '/broadcast',
    { preHandler: [requireAuth, requireOrganizer] },
    async (request, reply) => {
      const organizerId = (request as any).organizer.id;
      const body = validate(broadcastSchema, request.body);

      const result = await broadcastService.broadcastToEventAttendees(organizerId, body);

      return reply.status(201).send(
        successResponse({
          message: `Broadcast sent to ${result.sent} attendees`,
          sent: result.sent,
          eventTitle: result.eventTitle,
        })
      );
    }
  );
}
