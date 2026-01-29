import type { FastifyInstance } from 'fastify';
import { chatService } from './chat.service.js';
import {
  chatsQuerySchema,
  messagesQuerySchema,
  chatIdParamsSchema,
  createPersonalChatSchema,
  sendMessageSchema,
  type ChatsQuery,
  type MessagesQuery,
  type ChatIdParams,
  type CreatePersonalChatInput,
  type SendMessageInput,
} from './chat.schema.js';
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

export async function chatRoutes(fastify: FastifyInstance): Promise<void> {
  // ===========================================================================
  // CHAT ROOM ENDPOINTS
  // ===========================================================================

  /**
   * GET / - Get user's chat rooms
   */
  fastify.get<{ Querystring: ChatsQuery }>(
    '/',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const query = validate(chatsQuerySchema, request.query);

      const result = await chatService.getUserChats(userId, query);

      return reply.send(successResponse(result.items, result.meta));
    }
  );

  /**
   * POST / - Create or get personal chat
   */
  fastify.post<{ Body: CreatePersonalChatInput }>(
    '/',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const body = validate(createPersonalChatSchema, request.body);

      const result = await chatService.getOrCreatePersonalChat(userId, body.friendId);

      const status = result.isNew ? 201 : 200;
      return reply.status(status).send(successResponse({ chatId: result.id, isNew: result.isNew }));
    }
  );

  // ===========================================================================
  // MESSAGE ENDPOINTS
  // ===========================================================================

  /**
   * GET /:chatId/messages - Get messages (cursor pagination)
   */
  fastify.get<{ Params: ChatIdParams; Querystring: MessagesQuery }>(
    '/:chatId/messages',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const { chatId } = validate(chatIdParamsSchema, request.params);
      const query = validate(messagesQuerySchema, request.query);

      const result = await chatService.getMessages(userId, chatId, query);

      return reply.send(
        successResponse(result.items, {
          hasMore: result.hasMore,
          nextCursor: result.nextCursor,
        })
      );
    }
  );

  /**
   * POST /:chatId/messages - Send message
   */
  fastify.post<{ Params: ChatIdParams; Body: SendMessageInput }>(
    '/:chatId/messages',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const { chatId } = validate(chatIdParamsSchema, request.params);
      const body = validate(sendMessageSchema, request.body);

      const message = await chatService.sendMessage(userId, chatId, body);

      return reply.status(201).send(successResponse(message));
    }
  );

  /**
   * POST /:chatId/read - Mark chat as read
   */
  fastify.post<{ Params: ChatIdParams }>(
    '/:chatId/read',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.sub;
      const { chatId } = validate(chatIdParamsSchema, request.params);

      await chatService.markAsRead(userId, chatId);

      return reply.send(successResponse({ message: 'Chat marked as read' }));
    }
  );
}
