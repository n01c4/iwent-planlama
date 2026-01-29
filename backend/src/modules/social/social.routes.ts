import type { FastifyInstance } from 'fastify';
import { socialService } from './social.service.js';
import {
  paginationQuerySchema,
  friendRequestsQuerySchema,
  friendsSearchQuerySchema,
  friendRequestIdParamsSchema,
  friendIdParamsSchema,
  userIdParamsSchema,
  eventIdParamsSchema,
  sendFriendRequestSchema,
  respondFriendRequestSchema,
  likeEventSchema,
  type PaginationQuery,
  type FriendRequestsQuery,
  type FriendsSearchQuery,
  type FriendRequestIdParams,
  type FriendIdParams,
  type UserIdParams,
  type EventIdParams,
  type SendFriendRequestInput,
  type RespondFriendRequestInput,
  type LikeEventInput,
} from './social.schema.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/utils/errors.js';
import type { ZodType, ZodTypeDef } from 'zod';

// Helper to validate Zod schemas - properly infers output type
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

export async function socialRoutes(fastify: FastifyInstance): Promise<void> {
  // ===========================================================================
  // FRIENDS ENDPOINTS
  // ===========================================================================

  /**
   * GET /me/friends - Get user's friends list
   */
  fastify.get<{ Querystring: FriendsSearchQuery }>(
    '/me/friends',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const query = validate(friendsSearchQuerySchema, request.query);

      const result = await socialService.getFriends(userId, query);

      return reply.send(successResponse(result.items, result.meta));
    }
  );

  /**
   * GET /me/friends/requests - Get pending friend requests
   */
  fastify.get<{ Querystring: FriendRequestsQuery }>(
    '/me/friends/requests',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const query = validate(friendRequestsQuerySchema, request.query);

      const result = await socialService.getFriendRequests(userId, query);

      return reply.send(successResponse(result.items, result.meta));
    }
  );

  /**
   * POST /me/friends/requests - Send friend request
   */
  fastify.post<{ Body: SendFriendRequestInput }>(
    '/me/friends/requests',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const body = validate(sendFriendRequestSchema, request.body);

      const result = await socialService.sendFriendRequest(userId, body.userId);

      return reply.status(201).send(successResponse(result));
    }
  );

  /**
   * POST /me/friends/requests/:requestId - Accept or reject friend request
   */
  fastify.post<{ Params: FriendRequestIdParams; Body: RespondFriendRequestInput }>(
    '/me/friends/requests/:requestId',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const { requestId } = validate(friendRequestIdParamsSchema, request.params);
      const { action } = validate(respondFriendRequestSchema, request.body);

      await socialService.respondToFriendRequest(userId, requestId, action);

      return reply.send(successResponse({ message: `Friend request ${action}ed` }));
    }
  );

  /**
   * DELETE /me/friends/:friendId - Remove friend
   */
  fastify.delete<{ Params: FriendIdParams }>(
    '/me/friends/:friendId',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const { friendId } = validate(friendIdParamsSchema, request.params);

      await socialService.removeFriend(userId, friendId);

      return reply.status(204).send();
    }
  );

  // ===========================================================================
  // BLOCKING ENDPOINTS
  // ===========================================================================

  /**
   * POST /me/friends/:userId/block - Block user
   */
  fastify.post<{ Params: UserIdParams }>(
    '/me/friends/:userId/block',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const { userId: targetUserId } = validate(userIdParamsSchema, request.params);

      await socialService.blockUser(userId, targetUserId);

      return reply.send(successResponse({ message: 'User blocked' }));
    }
  );

  /**
   * GET /me/blocked - Get blocked users
   */
  fastify.get('/me/blocked', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user!.sub;

    const result = await socialService.getBlockedUsers(userId);

    return reply.send(successResponse(result));
  });

  /**
   * DELETE /me/blocked/:userId - Unblock user
   */
  fastify.delete<{ Params: UserIdParams }>(
    '/me/blocked/:userId',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const { userId: targetUserId } = validate(userIdParamsSchema, request.params);

      await socialService.unblockUser(userId, targetUserId);

      return reply.status(204).send();
    }
  );

  // ===========================================================================
  // LIKES ENDPOINTS
  // ===========================================================================

  /**
   * GET /me/likes - Get liked events
   */
  fastify.get<{ Querystring: PaginationQuery }>(
    '/me/likes',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const query = validate(paginationQuerySchema, request.query);

      const result = await socialService.getLikedEvents(userId, query);

      return reply.send(successResponse(result.items, result.meta));
    }
  );

  /**
   * POST /me/likes - Like an event
   */
  fastify.post<{ Body: LikeEventInput }>(
    '/me/likes',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const body = validate(likeEventSchema, request.body);

      await socialService.likeEvent(userId, body.eventId);

      return reply.status(201).send(successResponse({ message: 'Event liked' }));
    }
  );

  /**
   * DELETE /me/likes/:eventId - Unlike an event
   */
  fastify.delete<{ Params: EventIdParams }>(
    '/me/likes/:eventId',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const { eventId } = validate(eventIdParamsSchema, request.params);

      await socialService.unlikeEvent(userId, eventId);

      return reply.status(204).send();
    }
  );
}
