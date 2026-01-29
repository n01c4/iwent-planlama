import { prisma } from '../../shared/database/index.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError
} from '../../shared/utils/errors.js';
import type { UserTicketsQueryInput, RefundRequestInput, TransferTicketInput } from './tickets.schema.js';
import type { Prisma, TicketStatus } from '@prisma/client';

/**
 * Ticket Response Interface
 */
export interface TicketResponse {
  id: string;
  qrCode: string | null;
  status: string;
  ticketType: {
    id: string;
    name: string;
    description: string | null;
    price: number;
  };
  event: {
    id: string;
    title: string;
    slug: string;
    startDate: Date;
    endDate: Date | null;
    bannerUrl: string | null;
    address: string | null;
    city: string | null;
    venue: {
      name: string;
      address: string | null;
      city: string | null;
    } | null;
  };
  order: {
    id: string;
    orderNumber: string;
  } | null;
  transferredAt: Date | null;
  originalOwnerId: string | null;
  checkedInAt: Date | null;
  refundedAt: Date | null;
  refundReason: string | null;
  createdAt: Date;
}

class TicketsService {
  /**
   * Get user's tickets
   */
  async getUserTickets(
    userId: string,
    query: UserTicketsQueryInput
  ): Promise<{ items: TicketResponse[]; meta: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean } }> {
    const { page, limit, status, upcoming } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = { userId };

    if (status) {
      where.status = status as TicketStatus;
    }

    if (upcoming) {
      where.event = {
        startDate: { gte: new Date() },
      };
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: [
          { event: { startDate: 'asc' } },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
        select: {
          id: true,
          qrCode: true,
          status: true,
          transferredAt: true,
          originalOwnerId: true,
          checkedInAt: true,
          refundedAt: true,
          refundReason: true,
          createdAt: true,
          ticketType: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              startDate: true,
              endDate: true,
              bannerUrl: true,
              address: true,
              city: true,
              venue: {
                select: {
                  name: true,
                  address: true,
                  city: true,
                },
              },
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: tickets.map(ticket => ({
        ...ticket,
        ticketType: {
          ...ticket.ticketType,
          price: Number(ticket.ticketType.price),
        },
      })),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(userId: string, ticketId: string): Promise<TicketResponse> {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, userId },
      select: {
        id: true,
        qrCode: true,
        status: true,
        transferredAt: true,
        originalOwnerId: true,
        checkedInAt: true,
        refundedAt: true,
        refundReason: true,
        createdAt: true,
        ticketType: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startDate: true,
            endDate: true,
            bannerUrl: true,
            address: true,
            city: true,
            venue: {
              select: {
                name: true,
                address: true,
                city: true,
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    return {
      ...ticket,
      ticketType: {
        ...ticket.ticketType,
        price: Number(ticket.ticketType.price),
      },
    };
  }

  /**
   * Request refund for a ticket
   */
  async requestRefund(
    userId: string,
    ticketId: string,
    data: RefundRequestInput
  ): Promise<TicketResponse> {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, userId },
      include: {
        event: {
          select: {
            startDate: true,
            organizer: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    if (ticket.status !== 'CONFIRMED') {
      throw new ConflictError('Only confirmed tickets can be refunded');
    }

    if (ticket.transferredAt) {
      throw new ForbiddenError('Transferred tickets cannot be refunded');
    }

    if (ticket.checkedInAt) {
      throw new ForbiddenError('Checked-in tickets cannot be refunded');
    }

    // Check if event has already started
    if (ticket.event.startDate < new Date()) {
      throw new ForbiddenError('Cannot refund ticket for past events');
    }

    // Update ticket with refund request
    // Note: Actual refund processing would be done by organizer
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        refundReason: data.reason,
        // Status remains CONFIRMED until organizer approves refund
      },
    });

    return this.getTicketById(userId, ticketId);
  }

  /**
   * Transfer ticket to another user
   */
  async transferTicket(
    userId: string,
    ticketId: string,
    data: TransferTicketInput
  ): Promise<TicketResponse> {
    // Find recipient user
    const recipient = await prisma.user.findUnique({
      where: { email: data.recipientEmail },
      select: { id: true },
    });

    if (!recipient) {
      throw new NotFoundError('Recipient user not found. They must have an account first.');
    }

    if (recipient.id === userId) {
      throw new BadRequestError('Cannot transfer ticket to yourself');
    }

    return await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findFirst({
        where: { id: ticketId, userId },
        include: {
          event: {
            select: { startDate: true },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundError('Ticket not found');
      }

      if (ticket.status !== 'CONFIRMED') {
        throw new ConflictError('Only confirmed tickets can be transferred');
      }

      if (ticket.transferredAt) {
        throw new ForbiddenError('This ticket has already been transferred');
      }

      if (ticket.checkedInAt) {
        throw new ForbiddenError('Checked-in tickets cannot be transferred');
      }

      if (ticket.refundReason) {
        throw new ForbiddenError('Tickets with pending refund requests cannot be transferred');
      }

      // Check if event has already started
      if (ticket.event.startDate < new Date()) {
        throw new ForbiddenError('Cannot transfer ticket for past events');
      }

      // Transfer the ticket
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          userId: recipient.id,
          originalOwnerId: userId,
          transferredAt: new Date(),
        },
      });

      // Return the updated ticket for the new owner
      const updatedTicket = await tx.ticket.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          qrCode: true,
          status: true,
          transferredAt: true,
          originalOwnerId: true,
          checkedInAt: true,
          refundedAt: true,
          refundReason: true,
          createdAt: true,
          ticketType: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              startDate: true,
              endDate: true,
              bannerUrl: true,
              address: true,
              city: true,
              venue: {
                select: {
                  name: true,
                  address: true,
                  city: true,
                },
              },
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
        },
      });

      return {
        ...updatedTicket!,
        ticketType: {
          ...updatedTicket!.ticketType,
          price: Number(updatedTicket!.ticketType.price),
        },
      };
    });
  }
}

export const ticketsService = new TicketsService();
