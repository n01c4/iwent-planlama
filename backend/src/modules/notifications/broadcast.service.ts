import { prisma } from '../../shared/database/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/utils/errors.js';
import { notificationsService } from './notifications.service.js';
import type { BroadcastInput } from './notifications.schema.js';

// =============================================================================
// BROADCAST SERVICE
// =============================================================================

class BroadcastService {
  /**
   * Send broadcast notification to event attendees
   * Only organizer of the event can broadcast
   */
  async broadcastToEventAttendees(
    organizerId: string,
    input: BroadcastInput
  ): Promise<{ sent: number; eventTitle: string }> {
    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: input.eventId },
      select: {
        id: true,
        title: true,
        organizerId: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new ForbiddenError('You do not have permission to broadcast to this event');
    }

    // Get all users with confirmed tickets for this event
    const tickets = await prisma.ticket.findMany({
      where: {
        eventId: input.eventId,
        status: 'CONFIRMED',
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    if (tickets.length === 0) {
      return { sent: 0, eventTitle: event.title };
    }

    const userIds = tickets.map((t) => t.userId);

    // Determine notification type based on broadcast type
    const notificationType = this.mapBroadcastTypeToNotification(input.type);

    // Create notifications for all attendees
    const result = await notificationsService.createBulkNotifications(userIds, {
      type: notificationType,
      title: input.title,
      body: input.body,
      data: {
        eventId: input.eventId,
        eventTitle: event.title,
        broadcastType: input.type,
      },
      actionUrl: `/events/${input.eventId}`,
      channels: input.channels,
    });

    return { sent: result.created, eventTitle: event.title };
  }

  /**
   * Map broadcast type to notification type
   */
  private mapBroadcastTypeToNotification(type: 'announcement' | 'reminder' | 'update'): 'broadcast' | 'event_reminder' | 'event_updated' {
    const mapping = {
      announcement: 'broadcast' as const,
      reminder: 'event_reminder' as const,
      update: 'event_updated' as const,
    };
    return mapping[type];
  }

  /**
   * Get broadcast history for an event
   */
  async getBroadcastHistory(
    organizerId: string,
    eventId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    items: Array<{
      id: string;
      title: string;
      body: string;
      type: string;
      sentAt: Date;
      recipientCount: number;
    }>;
    total: number;
  }> {
    // Verify event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.organizerId !== organizerId) {
      throw new ForbiddenError('You do not have permission to view this event');
    }

    // Get broadcast notifications for this event
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: {
          type: { in: ['broadcast', 'event_reminder', 'event_updated'] },
          data: {
            path: ['eventId'],
            equals: eventId,
          },
        },
        distinct: ['title', 'body', 'createdAt'],
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: {
          type: { in: ['broadcast', 'event_reminder', 'event_updated'] },
          data: {
            path: ['eventId'],
            equals: eventId,
          },
        },
      }),
    ]);

    // Group by unique broadcasts and count recipients
    const uniqueBroadcasts = new Map<string, any>();
    for (const n of notifications) {
      const key = `${n.title}-${n.body}-${n.createdAt.toISOString()}`;
      if (!uniqueBroadcasts.has(key)) {
        uniqueBroadcasts.set(key, {
          id: n.id,
          title: n.title,
          body: n.body,
          type: n.type,
          sentAt: n.createdAt,
          recipientCount: 1,
        });
      } else {
        uniqueBroadcasts.get(key)!.recipientCount++;
      }
    }

    return {
      items: Array.from(uniqueBroadcasts.values()),
      total,
    };
  }
}

export const broadcastService = new BroadcastService();
