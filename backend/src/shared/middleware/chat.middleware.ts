import type { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError } from '../utils/errors.js';
import { chatService } from '../../modules/chat/chat.service.js';

/**
 * Middleware: Require active chat participant
 * Verifies user is an active participant in the chat room
 */
export async function requireChatParticipant(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const userId = request.user?.sub;
  const chatId = (request.params as { chatId?: string }).chatId;

  if (!userId || !chatId) {
    throw new ForbiddenError('Access denied');
  }

  const isParticipant = await chatService.isParticipant(userId, chatId);
  if (!isParticipant) {
    throw new ForbiddenError('You are not a participant in this chat');
  }
}

/**
 * Middleware: Require chat not frozen
 * Verifies the chat is not frozen (for sending messages)
 */
export async function requireChatNotFrozen(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const userId = request.user?.sub;
  const chatId = (request.params as { chatId?: string }).chatId;

  if (!userId || !chatId) {
    throw new ForbiddenError('Access denied');
  }

  const result = await chatService.canSendMessage(userId, chatId);
  if (!result.allowed) {
    throw new ForbiddenError(result.reason || 'Cannot send message');
  }
}
