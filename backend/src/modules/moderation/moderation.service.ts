import { prisma } from '../../shared/database/prisma.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../shared/utils/errors.js';
import { notificationsService } from '../notifications/notifications.service.js';
import type {
  ReportsQuery,
  ChatsQuery,
  ChatMessagesQuery,
  CreateReportInput,
  ReportActionInput,
  ChatActionInput,
  UpdateFiltersInput,
  ReportResponse,
  ModerationChatResponse,
  ModerationFiltersResponse,
} from './moderation.schema.js';

// =============================================================================
// RESPONSE TYPES
// =============================================================================

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

interface MessageResponse {
  id: string;
  senderId: string;
  sender: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  content: string;
  mediaUrl: string | null;
  createdAt: Date;
  deletedAt: Date | null;
}

// =============================================================================
// MODERATION SERVICE
// =============================================================================

class ModerationService {
  // ===========================================================================
  // REPORTS MANAGEMENT
  // ===========================================================================

  /**
   * Get reports for organizer's events
   */
  async getReports(
    organizerId: string,
    query: ReportsQuery
  ): Promise<PaginatedResponse<ReportResponse>> {
    const { page, limit, status, entityType } = query;
    const skip = (page - 1) * limit;

    const where = {
      organizerId,
      ...(status && { status }),
      ...(entityType && { entityType }),
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reportedBy: {
            select: { id: true, name: true, avatarUrl: true },
          },
          resolvedBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    const items: ReportResponse[] = reports.map((r) => ({
      id: r.id,
      entityType: r.entityType,
      entityId: r.entityId,
      reason: r.reason,
      description: r.description,
      status: r.status,
      actionTaken: r.actionTaken,
      actionNote: r.actionNote,
      reportedBy: r.reportedBy,
      resolvedBy: r.resolvedBy,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
    }));

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
   * Get single report
   */
  async getReport(organizerId: string, reportId: string): Promise<ReportResponse> {
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        organizerId,
      },
      include: {
        reportedBy: {
          select: { id: true, name: true, avatarUrl: true },
        },
        resolvedBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    return {
      id: report.id,
      entityType: report.entityType,
      entityId: report.entityId,
      reason: report.reason,
      description: report.description,
      status: report.status,
      actionTaken: report.actionTaken,
      actionNote: report.actionNote,
      reportedBy: report.reportedBy,
      resolvedBy: report.resolvedBy,
      createdAt: report.createdAt,
      resolvedAt: report.resolvedAt,
    };
  }

  /**
   * Create a report (user action)
   */
  async createReport(
    userId: string,
    input: CreateReportInput
  ): Promise<{ id: string }> {
    // Determine organizer from entity
    const organizerId = await this.getOrganizerIdFromEntity(input.entityType, input.entityId);

    if (!organizerId) {
      throw new BadRequestError('Cannot determine organizer for this entity');
    }

    // Check for duplicate report
    const existing = await prisma.report.findUnique({
      where: {
        reportedById_entityType_entityId: {
          reportedById: userId,
          entityType: input.entityType,
          entityId: input.entityId,
        },
      },
    });

    if (existing) {
      throw new ConflictError('You have already reported this content');
    }

    const report = await prisma.report.create({
      data: {
        organizerId,
        reportedById: userId,
        entityType: input.entityType,
        entityId: input.entityId,
        reason: input.reason,
        description: input.description,
      },
    });

    return { id: report.id };
  }

  /**
   * Take action on a report
   */
  async takeReportAction(
    organizerId: string,
    resolverUserId: string,
    reportId: string,
    input: ReportActionInput
  ): Promise<void> {
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        organizerId,
        status: 'pending',
      },
    });

    if (!report) {
      throw new NotFoundError('Report not found or already resolved');
    }

    // Determine action taken
    let actionTaken: 'warning' | 'message_deleted' | 'user_banned' | 'none' = 'none';
    if (input.action === 'approve') {
      if (input.userAction === 'ban') {
        actionTaken = 'user_banned';
      } else if (input.userAction === 'warning') {
        actionTaken = 'warning';
      } else if (report.entityType === 'message') {
        actionTaken = 'message_deleted';
        // Delete the message
        await prisma.message.update({
          where: { id: report.entityId },
          data: { deletedAt: new Date() },
        });
      }
    }

    // Update report
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: input.action === 'archive' ? 'pending' : (input.action === 'approve' ? 'resolved' : 'dismissed'),
        actionTaken,
        actionNote: input.actionNote,
        resolvedAt: input.action !== 'archive' ? new Date() : null,
        resolvedById: input.action !== 'archive' ? resolverUserId : null,
      },
    });

    // TODO: If userAction is 'warning' or 'ban', create notification to user
  }

  /**
   * Get organizer ID from reported entity
   */
  private async getOrganizerIdFromEntity(
    entityType: string,
    entityId: string
  ): Promise<string | null> {
    switch (entityType) {
      case 'message': {
        const message = await prisma.message.findUnique({
          where: { id: entityId },
          include: {
            chatRoom: {
              include: {
                event: {
                  select: { organizerId: true },
                },
              },
            },
          },
        });
        return message?.chatRoom?.event?.organizerId || null;
      }
      case 'event': {
        const event = await prisma.event.findUnique({
          where: { id: entityId },
          select: { organizerId: true },
        });
        return event?.organizerId || null;
      }
      case 'review': {
        // Assuming reviews are for venues
        const review = await prisma.venueReview.findUnique({
          where: { id: entityId },
          include: {
            venue: {
              select: { managedByOrganizerId: true },
            },
          },
        });
        return review?.venue?.managedByOrganizerId || null;
      }
      default:
        return null;
    }
  }

  // ===========================================================================
  // CHAT MODERATION
  // ===========================================================================

  /**
   * Get event chat rooms for moderation
   */
  async getChats(
    organizerId: string,
    query: ChatsQuery
  ): Promise<PaginatedResponse<ModerationChatResponse>> {
    const { page, limit, eventId, isFrozen } = query;
    const skip = (page - 1) * limit;

    // Get organizer's event IDs
    const events = await prisma.event.findMany({
      where: { organizerId },
      select: { id: true },
    });
    const eventIds = events.map((e) => e.id);

    const where = {
      type: 'event' as const,
      eventId: { in: eventIds },
      ...(eventId && { eventId }),
      ...(isFrozen !== undefined && { isFrozen }),
    };

    const [chatRooms, total] = await Promise.all([
      prisma.chatRoom.findMany({
        where,
        include: {
          event: {
            select: { id: true, title: true },
          },
          frozenBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        skip,
        take: limit,
      }),
      prisma.chatRoom.count({ where }),
    ]);

    const items: ModerationChatResponse[] = chatRooms.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      eventId: c.eventId,
      event: c.event,
      participantCount: c.participantCount,
      messageCount: c.messageCount,
      isFrozen: c.isFrozen,
      frozenAt: c.frozenAt,
      frozenBy: c.frozenBy,
      lastMessageAt: c.lastMessageAt,
      createdAt: c.createdAt,
    }));

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
   * Get chat messages for moderation
   */
  async getChatMessages(
    organizerId: string,
    chatId: string,
    query: ChatMessagesQuery
  ): Promise<PaginatedResponse<MessageResponse>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    // Verify chat belongs to organizer's event
    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id: chatId,
        type: 'event',
        event: {
          organizerId,
        },
      },
    });

    if (!chatRoom) {
      throw new NotFoundError('Chat room not found');
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { chatRoomId: chatId },
        include: {
          sender: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { chatRoomId: chatId } }),
    ]);

    const items: MessageResponse[] = messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      sender: m.sender,
      content: m.content,
      mediaUrl: m.mediaUrl,
      createdAt: m.createdAt,
      deletedAt: m.deletedAt,
    }));

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
   * Take action on a chat
   */
  async takeChatAction(
    organizerId: string,
    moderatorUserId: string,
    chatId: string,
    input: ChatActionInput
  ): Promise<{ message: string }> {
    // Verify chat belongs to organizer's event
    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id: chatId,
        type: 'event',
        event: {
          organizerId,
        },
      },
      include: {
        event: {
          select: { title: true },
        },
        participants: {
          where: { leftAt: null },
          select: { userId: true },
        },
      },
    });

    if (!chatRoom) {
      throw new NotFoundError('Chat room not found');
    }

    switch (input.action) {
      case 'freeze':
        await prisma.chatRoom.update({
          where: { id: chatId },
          data: {
            isFrozen: true,
            frozenAt: new Date(),
            frozenById: moderatorUserId,
          },
        });

        if (input.notifyParticipants) {
          const userIds = chatRoom.participants.map((p) => p.userId);
          await notificationsService.createBulkNotifications(userIds, {
            type: 'broadcast',
            title: 'Sohbet donduruldu',
            body: input.reason || `${chatRoom.event?.title} etkinlik sohbeti geçici olarak donduruldu`,
            actionUrl: `/events/${chatRoom.eventId}`,
            channels: ['in_app'],
          });
        }
        return { message: 'Chat frozen successfully' };

      case 'unfreeze':
        await prisma.chatRoom.update({
          where: { id: chatId },
          data: {
            isFrozen: false,
            frozenAt: null,
            frozenById: null,
          },
        });
        return { message: 'Chat unfrozen successfully' };

      case 'delete':
        // Hard delete - remove chat room and all messages
        await prisma.$transaction([
          prisma.message.deleteMany({ where: { chatRoomId: chatId } }),
          prisma.chatParticipant.deleteMany({ where: { chatRoomId: chatId } }),
          prisma.spamTracker.deleteMany({ where: { chatRoomId: chatId } }),
          prisma.chatRoom.delete({ where: { id: chatId } }),
        ]);

        if (input.notifyParticipants) {
          const userIds = chatRoom.participants.map((p) => p.userId);
          await notificationsService.createBulkNotifications(userIds, {
            type: 'broadcast',
            title: 'Sohbet silindi',
            body: input.reason || `${chatRoom.event?.title} etkinlik sohbeti silindi`,
            channels: ['in_app'],
          });
        }
        return { message: 'Chat deleted successfully' };

      case 'clear-history':
        await prisma.message.deleteMany({ where: { chatRoomId: chatId } });
        await prisma.chatRoom.update({
          where: { id: chatId },
          data: {
            messageCount: 0,
            lastMessageAt: null,
          },
        });

        // Reset unread counts for all participants
        await prisma.chatParticipant.updateMany({
          where: { chatRoomId: chatId },
          data: {
            unreadCount: 0,
            lastReadAt: null,
            lastReadMessageId: null,
          },
        });

        if (input.notifyParticipants) {
          const userIds = chatRoom.participants.map((p) => p.userId);
          await notificationsService.createBulkNotifications(userIds, {
            type: 'broadcast',
            title: 'Sohbet geçmişi temizlendi',
            body: input.reason || `${chatRoom.event?.title} etkinlik sohbet geçmişi temizlendi`,
            channels: ['in_app'],
          });
        }
        return { message: 'Chat history cleared successfully' };

      default:
        throw new BadRequestError('Invalid action');
    }
  }

  // ===========================================================================
  // MODERATION FILTERS
  // ===========================================================================

  /**
   * Get moderation filters for organizer
   */
  async getFilters(organizerId: string): Promise<ModerationFiltersResponse> {
    let filter = await prisma.moderationFilter.findUnique({
      where: { organizerId },
    });

    // Create default filters if not exists
    if (!filter) {
      filter = await prisma.moderationFilter.create({
        data: {
          organizerId,
        },
      });
    }

    return {
      blockedWords: filter.blockedWords,
      blockedPatterns: filter.blockedPatterns,
      spamProtection: filter.spamProtection,
      mediaFilter: filter.mediaFilter,
      linkFilter: filter.linkFilter,
      updatedAt: filter.updatedAt,
    };
  }

  /**
   * Update moderation filters
   */
  async updateFilters(
    organizerId: string,
    input: UpdateFiltersInput
  ): Promise<ModerationFiltersResponse> {
    const filter = await prisma.moderationFilter.upsert({
      where: { organizerId },
      update: {
        ...(input.blockedWords !== undefined && { blockedWords: input.blockedWords }),
        ...(input.blockedPatterns !== undefined && { blockedPatterns: input.blockedPatterns }),
        ...(input.spamProtection !== undefined && { spamProtection: input.spamProtection }),
        ...(input.mediaFilter !== undefined && { mediaFilter: input.mediaFilter }),
        ...(input.linkFilter !== undefined && { linkFilter: input.linkFilter }),
      },
      create: {
        organizerId,
        blockedWords: input.blockedWords || [],
        blockedPatterns: input.blockedPatterns || [],
        spamProtection: input.spamProtection ?? true,
        mediaFilter: input.mediaFilter ?? false,
        linkFilter: input.linkFilter ?? false,
      },
    });

    return {
      blockedWords: filter.blockedWords,
      blockedPatterns: filter.blockedPatterns,
      spamProtection: filter.spamProtection,
      mediaFilter: filter.mediaFilter,
      linkFilter: filter.linkFilter,
      updatedAt: filter.updatedAt,
    };
  }
}

export const moderationService = new ModerationService();
