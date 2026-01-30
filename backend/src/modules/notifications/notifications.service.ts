import { prisma } from '../../shared/database/prisma.js';
import { NotFoundError } from '../../shared/utils/errors.js';
import { firebaseProvider } from './providers/firebase.provider.js';
import { emailProvider } from './providers/email.provider.js';
import type { Prisma } from '@prisma/client';
import type {
  NotificationsQuery,
  MarkReadInput,
  CreateNotificationInput,
  NotificationPreferences,
} from './notifications.schema.js';

// =============================================================================
// RESPONSE TYPES
// =============================================================================

interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  actionUrl: string | null;
  status: string;
  createdAt: Date;
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

// =============================================================================
// NOTIFICATIONS SERVICE
// =============================================================================

class NotificationsService {
  // ===========================================================================
  // USER NOTIFICATION ENDPOINTS
  // ===========================================================================

  /**
   * Get user's notifications
   */
  async getNotifications(
    userId: string,
    query: NotificationsQuery
  ): Promise<PaginatedResponse<NotificationResponse>> {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status }),
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    const items: NotificationResponse[] = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data as Record<string, unknown>,
      actionUrl: n.actionUrl,
      status: n.status,
      createdAt: n.createdAt,
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
   * Mark notifications as read
   */
  async markAsRead(userId: string, input: MarkReadInput): Promise<{ updated: number }> {
    if (input.all) {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          status: 'unread',
        },
        data: {
          status: 'read',
          readAt: new Date(),
        },
      });
      return { updated: result.count };
    }

    if (input.ids && input.ids.length > 0) {
      const result = await prisma.notification.updateMany({
        where: {
          id: { in: input.ids },
          userId,
          status: 'unread',
        },
        data: {
          status: 'read',
          readAt: new Date(),
        },
      });
      return { updated: result.count };
    }

    return { updated: 0 };
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        status: 'unread',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
  }

  // ===========================================================================
  // NOTIFICATION CREATION (INTERNAL)
  // ===========================================================================

  /**
   * Create and send notification
   * Called by other services (orders, social, etc.)
   */
  async createNotification(input: CreateNotificationInput): Promise<string> {
    const channels = input.channels || ['in_app'];

    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Create in-app notification
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: (input.data || {}) as Prisma.InputJsonValue,
        actionUrl: input.actionUrl,
        sentVia: channels as Prisma.InputJsonValue,
        expiresAt: input.expiresAt,
      },
    });

    // Send push notification (async, non-blocking)
    if (channels.includes('push')) {
      this.sendPushNotification(input).catch((err) => {
        console.error('[Notifications] Push failed:', err);
      });
    }

    // Send email notification (async, non-blocking)
    if (channels.includes('email') && user.email) {
      this.sendEmailNotification(user.email, input).catch((err) => {
        console.error('[Notifications] Email failed:', err);
      });
    }

    return notification.id;
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(
    userIds: string[],
    input: Omit<CreateNotificationInput, 'userId'>
  ): Promise<{ created: number }> {
    const channels = input.channels || ['in_app'];

    // Create in-app notifications in batch
    const result = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: (input.data || {}) as Prisma.InputJsonValue,
        actionUrl: input.actionUrl,
        sentVia: channels as Prisma.InputJsonValue,
        expiresAt: input.expiresAt,
      })),
    });

    // Send push notifications in background (if configured)
    if (channels.includes('push')) {
      this.sendBulkPushNotifications(userIds, input).catch((err) => {
        console.error('[Notifications] Bulk push failed:', err);
      });
    }

    // Send email notifications in background
    if (channels.includes('email')) {
      this.sendBulkEmailNotifications(userIds, input).catch((err) => {
        console.error('[Notifications] Bulk email failed:', err);
      });
    }

    return { created: result.count };
  }

  // ===========================================================================
  // PRIVATE: PUSH NOTIFICATIONS
  // ===========================================================================

  /**
   * Send push notification to user
   */
  private async sendPushNotification(input: CreateNotificationInput): Promise<void> {
    // TODO: Get user's FCM tokens from device registration
    // For now, we just log
    console.log('[Notifications] Would send push to user:', input.userId, input.title);

    // In production, you would:
    // 1. Get user's device tokens from a UserDevice table
    // 2. Call firebaseProvider.sendPush() for each token
  }

  /**
   * Send push notifications to multiple users
   */
  private async sendBulkPushNotifications(
    userIds: string[],
    input: Omit<CreateNotificationInput, 'userId'>
  ): Promise<void> {
    console.log('[Notifications] Would send bulk push to', userIds.length, 'users');

    // TODO: Implement when device tokens are available
  }

  // ===========================================================================
  // PRIVATE: EMAIL NOTIFICATIONS
  // ===========================================================================

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    email: string,
    input: CreateNotificationInput
  ): Promise<void> {
    const templateType = this.mapNotificationTypeToEmailTemplate(input.type);

    await emailProvider.sendTemplatedEmail(email, templateType, {
      title: input.title,
      body: input.body,
      actionUrl: input.actionUrl,
      ...(input.data || {}),
    });
  }

  /**
   * Send email notifications to multiple users
   */
  private async sendBulkEmailNotifications(
    userIds: string[],
    input: Omit<CreateNotificationInput, 'userId'>
  ): Promise<void> {
    // Get user emails
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });

    const templateType = this.mapNotificationTypeToEmailTemplate(input.type);

    const recipients = users
      .filter((u) => u.email)
      .map((u) => ({
        email: u.email,
        data: {
          title: input.title,
          body: input.body,
          actionUrl: input.actionUrl,
          ...(input.data || {}),
        },
      }));

    if (recipients.length > 0) {
      await emailProvider.sendBulkEmails(recipients, templateType);
    }
  }

  /**
   * Map notification type to email template
   */
  private mapNotificationTypeToEmailTemplate(type: string): 'friend_request' | 'ticket_purchased' | 'event_reminder' | 'event_cancelled' | 'broadcast' | 'default' {
    const mapping: Record<string, any> = {
      friend_request: 'friend_request',
      ticket_purchased: 'ticket_purchased',
      event_reminder: 'event_reminder',
      event_cancelled: 'event_cancelled',
      broadcast: 'broadcast',
    };
    return mapping[type] || 'default';
  }

  // ===========================================================================
  // HELPER: Trigger Notifications
  // ===========================================================================

  /**
   * Trigger friend request notification
   */
  async notifyFriendRequest(targetUserId: string, senderName: string, requestId: string): Promise<void> {
    await this.createNotification({
      userId: targetUserId,
      type: 'friend_request',
      title: 'Yeni arkadaşlık isteği',
      body: `${senderName} size arkadaşlık isteği gönderdi`,
      data: { requestId, senderName },
      actionUrl: '/friends/requests',
      channels: ['in_app', 'push'],
    });
  }

  /**
   * Trigger friend accepted notification
   */
  async notifyFriendAccepted(targetUserId: string, friendName: string): Promise<void> {
    await this.createNotification({
      userId: targetUserId,
      type: 'friend_accepted',
      title: 'Arkadaşlık isteği kabul edildi',
      body: `${friendName} arkadaşlık isteğinizi kabul etti`,
      data: { friendName },
      actionUrl: '/friends',
      channels: ['in_app', 'push'],
    });
  }

  /**
   * Trigger ticket purchase notification
   */
  async notifyTicketPurchase(
    userId: string,
    eventTitle: string,
    eventId: string,
    ticketCount: number,
    orderId: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: 'ticket_purchased',
      title: 'Bilet satın alma başarılı',
      body: `${eventTitle} etkinliği için ${ticketCount} adet biletiniz hazır`,
      data: { eventId, eventTitle, ticketCount, orderId },
      actionUrl: `/tickets`,
      channels: ['in_app', 'push', 'email'],
    });
  }

  /**
   * Trigger event reminder notification
   */
  async notifyEventReminder(
    userId: string,
    eventTitle: string,
    eventId: string,
    reminderType: '24h' | '2h'
  ): Promise<void> {
    const timeText = reminderType === '24h' ? 'yarın' : '2 saat içinde';
    await this.createNotification({
      userId,
      type: 'event_reminder',
      title: 'Etkinlik hatırlatması',
      body: `${eventTitle} etkinliği ${timeText} başlıyor!`,
      data: { eventId, eventTitle, reminderType },
      actionUrl: `/events/${eventId}`,
      channels: ['in_app', 'push'],
    });
  }

  /**
   * Trigger event cancellation notification
   */
  async notifyEventCancelled(
    userIds: string[],
    eventTitle: string,
    eventId: string
  ): Promise<void> {
    await this.createBulkNotifications(userIds, {
      type: 'event_cancelled',
      title: 'Etkinlik iptal edildi',
      body: `Üzgünüz, ${eventTitle} etkinliği iptal edilmiştir`,
      data: { eventId, eventTitle },
      actionUrl: `/events/${eventId}`,
      channels: ['in_app', 'push', 'email'],
    });
  }

  /**
   * Trigger new message notification
   */
  async notifyNewMessage(
    targetUserId: string,
    senderName: string,
    messagePreview: string,
    chatId: string
  ): Promise<void> {
    await this.createNotification({
      userId: targetUserId,
      type: 'message_received',
      title: senderName,
      body: messagePreview.substring(0, 100),
      data: { chatId, senderName },
      actionUrl: `/chats/${chatId}`,
      channels: ['in_app', 'push'],
    });
  }
}

export const notificationsService = new NotificationsService();
