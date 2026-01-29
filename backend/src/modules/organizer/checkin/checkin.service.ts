import { prisma } from '../../../shared/database/index.js';
import { NotFoundError, ConflictError, BadRequestError } from '../../../shared/utils/errors.js';
import type { AttendeesQuery, SingleCheckinInput, BulkCheckinInput } from './checkin.schema.js';
import type { Prisma, TicketStatus } from '@prisma/client';

// =============================================================================
// CHECK-IN SERVICE - Faz 6
// =============================================================================

/**
 * Attendee Response
 */
export interface AttendeeResponse {
  id: string;
  ticketId: string;
  qrCode: string | null;
  ticketType: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  status: string;
  checkedIn: boolean;
  checkedInAt: Date | null;
  orderNumber: string | null;
}

/**
 * Paginated Attendees Response
 */
export interface PaginatedAttendeesResponse {
  items: AttendeeResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    checkedInCount: number;
    notCheckedInCount: number;
  };
}

/**
 * Check-in Result
 */
export interface CheckinResult {
  success: boolean;
  ticket: {
    id: string;
    qrCode: string | null;
    status: string;
    checkedInAt: Date | null;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
    ticketType: {
      id: string;
      name: string;
    };
  };
  message: string;
}

/**
 * Bulk Check-in Result
 */
export interface BulkCheckinResult {
  successful: number;
  failed: number;
  results: {
    code: string;
    success: boolean;
    ticketId: string | null;
    message: string;
  }[];
}

class CheckinService {
  /**
   * Get attendees list for an event
   */
  async getAttendees(
    organizerId: string,
    eventId: string,
    query: AttendeesQuery
  ): Promise<PaginatedAttendeesResponse> {
    // Verify event belongs to organizer
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const { page, limit, search, checkedIn, ticketType } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TicketWhereInput = {
      eventId,
      status: 'CONFIRMED',
    };

    // Filter by check-in status
    if (checkedIn === true) {
      where.checkedInAt = { not: null };
    } else if (checkedIn === false) {
      where.checkedInAt = null;
    }

    // Filter by ticket type
    if (ticketType) {
      where.ticketTypeId = ticketType;
    }

    // Search by user name, email, or QR code
    if (search) {
      where.OR = [
        { qrCode: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get tickets with pagination
    const [tickets, total, checkedInCount] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: [
          { checkedInAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
        select: {
          id: true,
          qrCode: true,
          status: true,
          checkedInAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          ticketType: {
            select: {
              id: true,
              name: true,
            },
          },
          order: {
            select: {
              orderNumber: true,
            },
          },
        },
      }),
      prisma.ticket.count({ where }),
      prisma.ticket.count({
        where: {
          eventId,
          status: 'CONFIRMED',
          checkedInAt: { not: null },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const notCheckedInCount = total - checkedInCount;

    return {
      items: tickets.map(ticket => ({
        id: ticket.id,
        ticketId: ticket.id,
        qrCode: ticket.qrCode,
        ticketType: ticket.ticketType,
        user: ticket.user,
        status: ticket.status,
        checkedIn: ticket.checkedInAt !== null,
        checkedInAt: ticket.checkedInAt,
        orderNumber: ticket.order?.orderNumber || null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
        checkedInCount,
        notCheckedInCount,
      },
    };
  }

  /**
   * Single ticket check-in
   */
  async checkin(
    organizerId: string,
    eventId: string,
    userId: string,
    input: SingleCheckinInput
  ): Promise<CheckinResult> {
    // Verify event belongs to organizer
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
      select: { id: true, startDate: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Find ticket by ID or QR code
    const ticket = await prisma.ticket.findFirst({
      where: {
        eventId,
        ...(input.ticketId
          ? { id: input.ticketId }
          : { qrCode: input.code }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ticketType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    // Validate ticket status
    if (ticket.status !== 'CONFIRMED') {
      throw new ConflictError(`Ticket cannot be checked in - status is ${ticket.status}`);
    }

    // Check if already checked in
    if (ticket.checkedInAt) {
      return {
        success: false,
        ticket: {
          id: ticket.id,
          qrCode: ticket.qrCode,
          status: ticket.status,
          checkedInAt: ticket.checkedInAt,
          user: ticket.user,
          ticketType: ticket.ticketType,
        },
        message: `Ticket already checked in at ${ticket.checkedInAt.toISOString()}`,
      };
    }

    // Perform check-in
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        checkedInAt: new Date(),
        checkedInById: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ticketType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      ticket: {
        id: updatedTicket.id,
        qrCode: updatedTicket.qrCode,
        status: updatedTicket.status,
        checkedInAt: updatedTicket.checkedInAt,
        user: updatedTicket.user,
        ticketType: updatedTicket.ticketType,
      },
      message: 'Check-in successful',
    };
  }

  /**
   * Bulk ticket check-in (max 100 tickets)
   */
  async bulkCheckin(
    organizerId: string,
    eventId: string,
    userId: string,
    input: BulkCheckinInput
  ): Promise<BulkCheckinResult> {
    // Verify event belongs to organizer
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const results: BulkCheckinResult['results'] = [];
    let successful = 0;
    let failed = 0;

    // Process each code
    for (const code of input.codes) {
      // Find ticket by QR code
      const ticket = await prisma.ticket.findFirst({
        where: { eventId, qrCode: code },
        select: {
          id: true,
          status: true,
          checkedInAt: true,
        },
      });

      if (!ticket) {
        results.push({
          code,
          success: false,
          ticketId: null,
          message: 'Ticket not found',
        });
        failed++;
        continue;
      }

      if (ticket.status !== 'CONFIRMED') {
        results.push({
          code,
          success: false,
          ticketId: ticket.id,
          message: `Invalid status: ${ticket.status}`,
        });
        failed++;
        continue;
      }

      if (ticket.checkedInAt) {
        results.push({
          code,
          success: false,
          ticketId: ticket.id,
          message: 'Already checked in',
        });
        failed++;
        continue;
      }

      // Perform check-in
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          checkedInAt: new Date(),
          checkedInById: userId,
        },
      });

      results.push({
        code,
        success: true,
        ticketId: ticket.id,
        message: 'Check-in successful',
      });
      successful++;
    }

    return {
      successful,
      failed,
      results,
    };
  }

  /**
   * Undo check-in (for corrections)
   */
  async undoCheckin(
    organizerId: string,
    eventId: string,
    ticketId: string
  ): Promise<CheckinResult> {
    // Verify event belongs to organizer
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Find and validate ticket
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ticketType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    if (!ticket.checkedInAt) {
      throw new BadRequestError('Ticket is not checked in');
    }

    // Undo check-in
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        checkedInAt: null,
        checkedInById: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ticketType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      ticket: {
        id: updatedTicket.id,
        qrCode: updatedTicket.qrCode,
        status: updatedTicket.status,
        checkedInAt: updatedTicket.checkedInAt,
        user: updatedTicket.user,
        ticketType: updatedTicket.ticketType,
      },
      message: 'Check-in undone successfully',
    };
  }
}

export const checkinService = new CheckinService();
