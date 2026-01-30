import { prisma } from '../../shared/database/prisma.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../shared/utils/errors.js';
import { socialService } from '../social/social.service.js';
import { realtimeService, type BroadcastMessagePayload } from '../../shared/realtime/index.js';
import { filtersService } from '../moderation/filters.service.js';
import type { ChatsQuery, MessagesQuery, SendMessageInput } from './chat.schema.js';

// =============================================================================
// RESPONSE TYPES
// =============================================================================

interface UserSummary {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

interface ChatRoomSummary {
  id: string;
  name: string | null;
  type: string;
  eventId: string | null;
  event: {
    id: string;
    title: string;
    bannerUrl: string | null;
  } | null;
  unreadCount: number;
  lastMessage: {
    content: string;
    senderName: string | null;
    createdAt: Date;
  } | null;
  participants: UserSummary[];
  participantCount: number;
  isFrozen: boolean;
}

interface MessageResponse {
  id: string;
  chatRoomId: string;
  senderId: string;
  sender: UserSummary;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  replyTo: {
    id: string;
    content: string;
    senderName: string | null;
  } | null;
  createdAt: Date;
  editedAt: Date | null;
}

interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface CursorPaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  nextCursor: string | null;
}

// =============================================================================
// CHAT SERVICE
// =============================================================================

class ChatService {
  // ===========================================================================
  // CHAT ROOM MANAGEMENT
  // ===========================================================================

  /**
   * Get user's chat rooms
   */
  async getUserChats(
    userId: string,
    query: ChatsQuery
  ): Promise<PaginatedResponse<ChatRoomSummary>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    // Get user's active participations
    const [participations, total] = await Promise.all([
      prisma.chatParticipant.findMany({
        where: {
          userId,
          leftAt: null,
        },
        include: {
          chatRoom: {
            include: {
              event: {
                select: { id: true, title: true, bannerUrl: true },
              },
              messages: {
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                  sender: { select: { name: true } },
                },
              },
              participants: {
                where: { leftAt: null },
                take: 5,
                include: {
                  user: { select: { id: true, name: true, avatarUrl: true } },
                },
              },
            },
          },
        },
        orderBy: {
          chatRoom: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        },
        skip,
        take: limit,
      }),
      prisma.chatParticipant.count({
        where: { userId, leftAt: null },
      }),
    ]);

    const items: ChatRoomSummary[] = participations.map((p) => {
      const room = p.chatRoom;
      const lastMsg = room.messages[0];

      return {
        id: room.id,
        name: room.name,
        type: room.type,
        eventId: room.eventId,
        event: room.event,
        unreadCount: p.unreadCount,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              senderName: lastMsg.sender.name,
              createdAt: lastMsg.createdAt,
            }
          : null,
        participants: room.participants
          .filter((part) => part.userId !== userId)
          .map((part) => part.user),
        participantCount: room.participantCount,
        isFrozen: room.isFrozen,
      };
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + items.length < total,
      },
    };
  }

  /**
   * Get or create personal chat between two users
   */
  async getOrCreatePersonalChat(
    userId: string,
    friendId: string
  ): Promise<{ id: string; isNew: boolean }> {
    // Cannot chat with yourself
    if (userId === friendId) {
      throw new BadRequestError('Cannot create chat with yourself');
    }

    // Check if they are friends
    const areFriends = await socialService.areFriends(userId, friendId);
    if (!areFriends) {
      throw new ForbiddenError('Can only chat with friends');
    }

    // Check if blocked
    const hasBlock = await socialService.hasBlockRelation(userId, friendId);
    if (hasBlock) {
      throw new ForbiddenError('Cannot chat with blocked user');
    }

    // Check if friend exists
    const friend = await prisma.user.findUnique({
      where: { id: friendId },
    });
    if (!friend) {
      throw new NotFoundError('User not found');
    }

    // Find existing personal chat
    const existingChat = await this.findPersonalChat(userId, friendId);
    if (existingChat) {
      return { id: existingChat.id, isNew: false };
    }

    // Create new personal chat
    const chatRoom = await prisma.chatRoom.create({
      data: {
        type: 'personal',
        participantCount: 2,
        participants: {
          createMany: {
            data: [{ userId }, { userId: friendId }],
          },
        },
      },
    });

    return { id: chatRoom.id, isNew: true };
  }

  /**
   * Find existing personal chat between two users
   */
  async findPersonalChat(userId1: string, userId2: string) {
    // Find a personal chat where both users are participants
    const participant1 = await prisma.chatParticipant.findFirst({
      where: {
        userId: userId1,
        leftAt: null,
        chatRoom: {
          type: 'personal',
          participants: {
            some: {
              userId: userId2,
              leftAt: null,
            },
          },
        },
      },
      include: {
        chatRoom: true,
      },
    });

    return participant1?.chatRoom || null;
  }

  /**
   * Create event chat room
   */
  async createEventChatRoom(eventId: string, createdById?: string): Promise<string> {
    // Check if chat room already exists
    const existing = await prisma.chatRoom.findFirst({
      where: { eventId, type: 'event' },
    });

    if (existing) {
      return existing.id;
    }

    // Create chat room
    const chatRoom = await prisma.chatRoom.create({
      data: {
        type: 'event',
        eventId,
        createdById,
      },
    });

    return chatRoom.id;
  }

  /**
   * Get event chat room
   */
  async getEventChatRoom(eventId: string) {
    return prisma.chatRoom.findFirst({
      where: { eventId, type: 'event' },
    });
  }

  // ===========================================================================
  // MESSAGES
  // ===========================================================================

  /**
   * Get messages for a chat room (cursor pagination)
   */
  async getMessages(
    userId: string,
    chatId: string,
    query: MessagesQuery
  ): Promise<CursorPaginatedResponse<MessageResponse>> {
    const { limit, before, after } = query;

    // Verify user is participant
    const isParticipant = await this.isParticipant(userId, chatId);
    if (!isParticipant) {
      throw new ForbiddenError('Not a participant in this chat');
    }

    // Build cursor filter
    let cursorFilter: object = {};
    if (before) {
      const cursorMessage = await prisma.message.findUnique({
        where: { id: before },
        select: { createdAt: true },
      });
      if (cursorMessage) {
        cursorFilter = { createdAt: { lt: cursorMessage.createdAt } };
      }
    } else if (after) {
      const cursorMessage = await prisma.message.findUnique({
        where: { id: after },
        select: { createdAt: true },
      });
      if (cursorMessage) {
        cursorFilter = { createdAt: { gt: cursorMessage.createdAt } };
      }
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        chatRoomId: chatId,
        deletedAt: null,
        ...cursorFilter,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Get one extra to check hasMore
    });

    const hasMore = messages.length > limit;
    const items = messages.slice(0, limit);

    const formattedItems: MessageResponse[] = items.map((m) => ({
      id: m.id,
      chatRoomId: m.chatRoomId,
      senderId: m.senderId,
      sender: m.sender,
      content: m.content,
      mediaUrl: m.mediaUrl,
      mediaType: m.mediaType,
      replyTo: m.replyTo
        ? {
            id: m.replyTo.id,
            content: m.replyTo.content,
            senderName: m.replyTo.sender.name,
          }
        : null,
      createdAt: m.createdAt,
      editedAt: m.editedAt,
    }));

    return {
      items: formattedItems,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  /**
   * Send message
   */
  async sendMessage(
    userId: string,
    chatId: string,
    data: SendMessageInput
  ): Promise<MessageResponse> {
    // Check if can send message
    const canSend = await this.canSendMessage(userId, chatId);
    if (!canSend.allowed) {
      throw new ForbiddenError(canSend.reason || 'Cannot send message');
    }

    // Get chat room for event ID (for filter check)
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatId },
      select: { eventId: true, type: true },
    });

    // Check message filters (for event chats only)
    if (chatRoom?.type === 'event' && chatRoom.eventId) {
      const filterResult = await filtersService.checkMessage(
        userId,
        chatId,
        data.content,
        !!data.mediaUrl,
        chatRoom.eventId
      );

      if (!filterResult.allowed) {
        throw new BadRequestError(filterResult.reason || 'Message blocked by filter');
      }
    }

    // Validate reply
    if (data.replyToId) {
      const replyMessage = await prisma.message.findFirst({
        where: { id: data.replyToId, chatRoomId: chatId, deletedAt: null },
      });
      if (!replyMessage) {
        throw new NotFoundError('Reply message not found');
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        chatRoomId: chatId,
        senderId: userId,
        content: data.content,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        replyToId: data.replyToId,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: { select: { name: true } },
          },
        },
      },
    });

    // Update chat room stats
    await prisma.chatRoom.update({
      where: { id: chatId },
      data: {
        lastMessageAt: new Date(),
        messageCount: { increment: 1 },
      },
    });

    // Increment unread count for other participants
    await this.incrementUnreadCounts(chatId, userId);

    // Broadcast message via realtime
    const broadcastPayload: BroadcastMessagePayload = {
      id: message.id,
      chatRoomId: message.chatRoomId,
      senderId: message.senderId,
      sender: message.sender,
      content: message.content,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            content: message.replyTo.content,
            senderName: message.replyTo.sender.name,
          }
        : null,
      createdAt: message.createdAt.toISOString(),
    };

    // Fire and forget - don't wait for broadcast
    realtimeService.broadcastMessage(chatId, broadcastPayload).catch((err) => {
      console.error('[Chat] Failed to broadcast message:', err);
    });

    return {
      id: message.id,
      chatRoomId: message.chatRoomId,
      senderId: message.senderId,
      sender: message.sender,
      content: message.content,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            content: message.replyTo.content,
            senderName: message.replyTo.sender.name,
          }
        : null,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
    };
  }

  /**
   * Mark chat as read
   */
  async markAsRead(userId: string, chatId: string): Promise<void> {
    // Verify participant
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatRoomId_userId: { chatRoomId: chatId, userId },
      },
    });

    if (!participant || participant.leftAt) {
      throw new ForbiddenError('Not a participant in this chat');
    }

    // Get latest message
    const latestMessage = await prisma.message.findFirst({
      where: { chatRoomId: chatId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    // Update participant
    await prisma.chatParticipant.update({
      where: { id: participant.id },
      data: {
        lastReadAt: new Date(),
        lastReadMessageId: latestMessage?.id || null,
        unreadCount: 0,
      },
    });

    // Broadcast read receipt
    realtimeService
      .broadcastReadReceipt(chatId, {
        userId,
        messageId: latestMessage?.id || null,
        readAt: new Date().toISOString(),
      })
      .catch((err) => {
        console.error('[Chat] Failed to broadcast read receipt:', err);
      });
  }

  // ===========================================================================
  // PARTICIPANT MANAGEMENT
  // ===========================================================================

  /**
   * Add user to event chat
   */
  async addParticipantToEventChat(userId: string, eventId: string): Promise<void> {
    // Get or create event chat room
    let chatRoom = await this.getEventChatRoom(eventId);

    if (!chatRoom) {
      const chatId = await this.createEventChatRoom(eventId);
      chatRoom = await prisma.chatRoom.findUnique({ where: { id: chatId } });
    }

    if (!chatRoom) {
      throw new NotFoundError('Failed to get or create event chat room');
    }

    // Check if already participant
    const existing = await prisma.chatParticipant.findUnique({
      where: {
        chatRoomId_userId: { chatRoomId: chatRoom.id, userId },
      },
    });

    if (existing) {
      // Rejoin if previously left
      if (existing.leftAt) {
        await prisma.chatParticipant.update({
          where: { id: existing.id },
          data: {
            leftAt: null,
            unreadCount: 0,
          },
        });

        // Update participant count
        await prisma.chatRoom.update({
          where: { id: chatRoom.id },
          data: { participantCount: { increment: 1 } },
        });
      }
      return;
    }

    // Add new participant
    await prisma.$transaction([
      prisma.chatParticipant.create({
        data: {
          chatRoomId: chatRoom.id,
          userId,
          role: 'member',
        },
      }),
      prisma.chatRoom.update({
        where: { id: chatRoom.id },
        data: { participantCount: { increment: 1 } },
      }),
    ]);
  }

  /**
   * Remove user from event chat
   */
  async removeParticipantFromEventChat(userId: string, eventId: string): Promise<void> {
    const chatRoom = await this.getEventChatRoom(eventId);

    if (!chatRoom) {
      return; // No chat room, nothing to do
    }

    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatRoomId_userId: { chatRoomId: chatRoom.id, userId },
      },
    });

    if (!participant || participant.leftAt) {
      return; // Not a participant or already left
    }

    await prisma.$transaction([
      prisma.chatParticipant.update({
        where: { id: participant.id },
        data: { leftAt: new Date() },
      }),
      prisma.chatRoom.update({
        where: { id: chatRoom.id },
        data: { participantCount: { decrement: 1 } },
      }),
    ]);
  }

  /**
   * Check if user is participant in chat
   */
  async isParticipant(userId: string, chatId: string): Promise<boolean> {
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatRoomId_userId: { chatRoomId: chatId, userId },
      },
    });

    return !!participant && !participant.leftAt;
  }

  /**
   * Check if user can send messages in chat
   */
  async canSendMessage(
    userId: string,
    chatId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Get chat room
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          where: { leftAt: null },
          select: { userId: true },
        },
      },
    });

    if (!chatRoom) {
      return { allowed: false, reason: 'Chat not found' };
    }

    // Check if participant
    const isParticipant = chatRoom.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      return { allowed: false, reason: 'Not a participant in this chat' };
    }

    // Check if frozen
    if (chatRoom.isFrozen) {
      return { allowed: false, reason: 'This chat is frozen' };
    }

    // For personal chats, check if still friends and not blocked
    if (chatRoom.type === 'personal') {
      const otherUser = chatRoom.participants.find((p) => p.userId !== userId);
      if (otherUser) {
        const areFriends = await socialService.areFriends(userId, otherUser.userId);
        if (!areFriends) {
          return { allowed: false, reason: 'Can only message friends' };
        }

        const hasBlock = await socialService.hasBlockRelation(userId, otherUser.userId);
        if (hasBlock) {
          return { allowed: false, reason: 'Cannot message blocked user' };
        }
      }
    }

    // For event chats, check if user has confirmed ticket
    if (chatRoom.type === 'event' && chatRoom.eventId) {
      const ticket = await prisma.ticket.findFirst({
        where: {
          userId,
          eventId: chatRoom.eventId,
          status: 'CONFIRMED',
        },
      });

      if (!ticket) {
        return { allowed: false, reason: 'Only ticket holders can message in event chat' };
      }
    }

    return { allowed: true };
  }

  /**
   * Increment unread count for all participants except sender
   */
  private async incrementUnreadCounts(chatId: string, excludeUserId: string): Promise<void> {
    await prisma.chatParticipant.updateMany({
      where: {
        chatRoomId: chatId,
        userId: { not: excludeUserId },
        leftAt: null,
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });
  }
}

export const chatService = new ChatService();
