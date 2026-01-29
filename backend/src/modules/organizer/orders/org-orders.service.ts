import { prisma } from '../../../shared/database/index.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../../../shared/utils/errors.js';
import type { EventOrdersQueryInput, RefundOrderInput } from './org-orders.schema.js';
import type { Prisma, OrderStatus } from '@prisma/client';

/**
 * Organizer Order Response
 */
export interface OrgOrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  amount: number;
  currency: string;
  subtotal: number;
  discountAmount: number;
  serviceFee: number;
  customer: {
    id: string;
    name: string | null;
    email: string;
  };
  items: {
    id: string;
    ticketTypeName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  tickets: {
    id: string;
    qrCode: string | null;
    status: string;
    checkedInAt: Date | null;
    refundedAt: Date | null;
  }[];
  discountCode: string | null;
  paymentMethod: string | null;
  confirmedAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

class OrgOrdersService {
  /**
   * Get orders for an event
   */
  async getEventOrders(
    organizerId: string,
    eventId: string,
    query: EventOrdersQueryInput
  ): Promise<PaginatedResponse<OrgOrderResponse>> {
    // Verify event belongs to organizer
    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const { page, limit, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { eventId };

    if (status) {
      where.status = status as OrderStatus;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          amount: true,
          currency: true,
          subtotal: true,
          discountAmount: true,
          serviceFee: true,
          paymentMethod: true,
          confirmedAt: true,
          refundedAt: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          discountCode: {
            select: { code: true },
          },
          orderItems: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              ticketType: {
                select: { name: true },
              },
            },
          },
          tickets: {
            select: {
              id: true,
              qrCode: true,
              status: true,
              checkedInAt: true,
              refundedAt: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        amount: Number(order.amount),
        currency: order.currency,
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discountAmount),
        serviceFee: Number(order.serviceFee),
        customer: order.user,
        items: order.orderItems.map(item => ({
          id: item.id,
          ticketTypeName: item.ticketType.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        tickets: order.tickets,
        discountCode: order.discountCode?.code || null,
        paymentMethod: order.paymentMethod,
        confirmedAt: order.confirmedAt,
        refundedAt: order.refundedAt,
        createdAt: order.createdAt,
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
   * Get order by ID (organizer view)
   */
  async getOrderById(organizerId: string, orderId: string): Promise<OrgOrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        amount: true,
        currency: true,
        subtotal: true,
        discountAmount: true,
        serviceFee: true,
        paymentMethod: true,
        confirmedAt: true,
        refundedAt: true,
        createdAt: true,
        event: {
          select: { organizerId: true },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        discountCode: {
          select: { code: true },
        },
        orderItems: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            ticketType: {
              select: { name: true },
            },
          },
        },
        tickets: {
          select: {
            id: true,
            qrCode: true,
            status: true,
            checkedInAt: true,
            refundedAt: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.event.organizerId !== organizerId) {
      throw new ForbiddenError('You do not have permission to view this order');
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      amount: Number(order.amount),
      currency: order.currency,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      serviceFee: Number(order.serviceFee),
      customer: order.user,
      items: order.orderItems.map(item => ({
        id: item.id,
        ticketTypeName: item.ticketType.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      tickets: order.tickets,
      discountCode: order.discountCode?.code || null,
      paymentMethod: order.paymentMethod,
      confirmedAt: order.confirmedAt,
      refundedAt: order.refundedAt,
      createdAt: order.createdAt,
    };
  }

  /**
   * Refund an order
   */
  async refundOrder(
    organizerId: string,
    eventId: string,
    orderId: string,
    data: RefundOrderInput
  ): Promise<OrgOrderResponse> {
    return await prisma.$transaction(async (tx) => {
      // Verify event belongs to organizer
      const event = await tx.event.findFirst({
        where: { id: eventId, organizerId, deletedAt: null },
        select: { id: true },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Get order
      const order = await tx.order.findFirst({
        where: { id: orderId, eventId },
        include: {
          orderItems: true,
          tickets: true,
        },
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (order.status !== 'confirmed') {
        throw new ConflictError('Only confirmed orders can be refunded');
      }

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'refunded',
          refundedAt: new Date(),
        },
      });

      // Update tickets
      await tx.ticket.updateMany({
        where: { orderId },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
          refundReason: data.reason,
        },
      });

      // Update sold count for ticket types
      for (const item of order.orderItems) {
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { soldCount: { decrement: item.quantity } },
        });
      }

      // Update event attendee count
      const totalTickets = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      await tx.event.update({
        where: { id: eventId },
        data: { currentAttendees: { decrement: totalTickets } },
      });

      // TODO: Process actual refund through payment provider
      // For now, this is just updating the database status

      return this.getOrderById(organizerId, orderId);
    });
  }
}

export const orgOrdersService = new OrgOrdersService();
