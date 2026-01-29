import { prisma } from '../../shared/database/index.js';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError
} from '../../shared/utils/errors.js';
import { generateOrderNumber } from '../../shared/utils/order-number.js';
import { generateTicketQRCode } from '../../shared/utils/qr-generator.js';
import type { CreateOrderInput, UserOrdersQueryInput } from './orders.schema.js';
import { Prisma } from '@prisma/client';
import type { OrderStatus } from '@prisma/client';
// Faz 5: Import chat service for auto-join event chat
import { chatService } from '../chat/chat.service.js';

// Service fee percentage (5%)
const SERVICE_FEE_PERCENT = 0.05;

// Order expiration time (15 minutes)
const ORDER_EXPIRATION_MINUTES = 15;

/**
 * Order Response Interface
 */
export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  amount: number;
  currency: string;
  subtotal: number;
  discountAmount: number;
  serviceFee: number;
  items: {
    id: string;
    ticketTypeId: string;
    ticketTypeName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  event: {
    id: string;
    title: string;
    slug: string;
    startDate: Date;
    bannerUrl: string | null;
    venue: {
      name: string;
      city: string | null;
    } | null;
  };
  discountCode: string | null;
  expiresAt: Date | null;
  confirmedAt: Date | null;
  createdAt: Date;
}

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
    price: number;
  };
  event: {
    id: string;
    title: string;
    startDate: Date;
  };
  createdAt: Date;
}

/**
 * Apply discount code to subtotal
 */
async function applyDiscountCode(
  eventId: string,
  code: string,
  subtotal: number
): Promise<{ discountAmount: number; discountCodeId: string }> {
  const discountCode = await prisma.discountCode.findUnique({
    where: { eventId_code: { eventId, code } },
  });

  if (!discountCode) {
    throw new BadRequestError('Invalid discount code');
  }

  if (!discountCode.isActive) {
    throw new BadRequestError('Discount code is not active');
  }

  if (discountCode.expiresAt && discountCode.expiresAt < new Date()) {
    throw new BadRequestError('Discount code has expired');
  }

  if (discountCode.maxUses && discountCode.usedCount >= discountCode.maxUses) {
    throw new BadRequestError('Discount code usage limit reached');
  }

  const minPurchase = discountCode.minPurchaseAmount ? Number(discountCode.minPurchaseAmount) : 0;
  if (subtotal < minPurchase) {
    throw new BadRequestError(`Minimum purchase amount of ${minPurchase} TRY required for this discount`);
  }

  let discountAmount: number;
  if (discountCode.type === 'percentage') {
    discountAmount = subtotal * (Number(discountCode.value) / 100);
    const maxDiscount = discountCode.maxDiscountAmount ? Number(discountCode.maxDiscountAmount) : Infinity;
    discountAmount = Math.min(discountAmount, maxDiscount);
  } else {
    discountAmount = Number(discountCode.value);
  }

  // Discount cannot exceed subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  return {
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountCodeId: discountCode.id,
  };
}

/**
 * Calculate service fee
 */
function calculateServiceFee(subtotal: number, discountAmount: number): number {
  const afterDiscount = subtotal - discountAmount;
  return Math.round(afterDiscount * SERVICE_FEE_PERCENT * 100) / 100;
}

class OrdersService {
  /**
   * Create a new order with ticket reservation
   * Uses FOR UPDATE to prevent race conditions
   */
  async createOrder(userId: string, data: CreateOrderInput): Promise<OrderResponse> {
    // Get event and validate
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
      select: {
        id: true,
        status: true,
        startDate: true,
        deletedAt: true,
      },
    });

    if (!event || event.deletedAt) {
      throw new NotFoundError('Event not found');
    }

    if (event.status !== 'published') {
      throw new ForbiddenError('Event is not available for ticket sales');
    }

    if (event.startDate < new Date()) {
      throw new ForbiddenError('Event has already started');
    }

    // Get ticket type IDs
    const ticketTypeIds = data.items.map(item => item.ticketTypeId);

    // Use transaction with row-level locking for race condition prevention
    return await prisma.$transaction(async (tx) => {
      // Lock ticket types with FOR UPDATE using Prisma.join for proper array handling
      const ticketTypes = await tx.$queryRaw<Array<{
        id: string;
        name: string;
        price: Prisma.Decimal;
        capacity: number;
        sold_count: number;
        reserved_count: number;
        is_active: boolean;
        min_per_order: number;
        max_per_order: number;
        sale_start_date: Date | null;
        sale_end_date: Date | null;
        event_id: string;
      }>>`
        SELECT id, name, price, capacity, sold_count, reserved_count, is_active,
               min_per_order, max_per_order, sale_start_date, sale_end_date, event_id
        FROM ticket_types
        WHERE id IN (${Prisma.join(ticketTypeIds)})
        FOR UPDATE
      `;

      // Validate ticket types
      const ticketTypeMap = new Map(ticketTypes.map(tt => [tt.id, tt]));

      for (const item of data.items) {
        const ticketType = ticketTypeMap.get(item.ticketTypeId);

        if (!ticketType) {
          throw new NotFoundError(`Ticket type ${item.ticketTypeId} not found`);
        }

        if (ticketType.event_id !== data.eventId) {
          throw new BadRequestError('Ticket type does not belong to this event');
        }

        if (!ticketType.is_active) {
          throw new BadRequestError(`Ticket type "${ticketType.name}" is not available`);
        }

        // Check sale window
        const now = new Date();
        if (ticketType.sale_start_date && ticketType.sale_start_date > now) {
          throw new BadRequestError(`Sales for "${ticketType.name}" have not started yet`);
        }
        if (ticketType.sale_end_date && ticketType.sale_end_date < now) {
          throw new BadRequestError(`Sales for "${ticketType.name}" have ended`);
        }

        // Check quantity limits
        if (item.quantity < ticketType.min_per_order) {
          throw new BadRequestError(`Minimum ${ticketType.min_per_order} tickets required for "${ticketType.name}"`);
        }
        if (item.quantity > ticketType.max_per_order) {
          throw new BadRequestError(`Maximum ${ticketType.max_per_order} tickets allowed for "${ticketType.name}"`);
        }

        // Check availability (capacity - sold - reserved)
        const available = ticketType.capacity - ticketType.sold_count - ticketType.reserved_count;
        if (item.quantity > available) {
          throw new ConflictError(`Insufficient tickets available for "${ticketType.name}". Only ${available} left.`);
        }
      }

      // Calculate subtotal
      let subtotal = 0;
      for (const item of data.items) {
        const ticketType = ticketTypeMap.get(item.ticketTypeId)!;
        subtotal += Number(ticketType.price) * item.quantity;
      }

      // Apply discount code if provided
      let discountAmount = 0;
      let discountCodeId: string | null = null;

      if (data.discountCode) {
        const discountResult = await applyDiscountCode(data.eventId, data.discountCode, subtotal);
        discountAmount = discountResult.discountAmount;
        discountCodeId = discountResult.discountCodeId;
      }

      // Calculate service fee
      const serviceFee = calculateServiceFee(subtotal, discountAmount);

      // Calculate total amount
      const amount = subtotal - discountAmount + serviceFee;

      // Generate order number
      const orderNumber = generateOrderNumber();

      // Set expiration time
      const expiresAt = new Date(Date.now() + ORDER_EXPIRATION_MINUTES * 60 * 1000);

      // Create order
      const order = await tx.order.create({
        data: {
          userId,
          eventId: data.eventId,
          orderNumber,
          status: 'pending',
          amount,
          currency: 'TRY',
          subtotal,
          discountAmount,
          serviceFee,
          discountCodeId,
          expiresAt,
        },
      });

      // Create order items and tickets
      for (const item of data.items) {
        const ticketType = ticketTypeMap.get(item.ticketTypeId)!;

        // Create order item
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            unitPrice: ticketType.price,
            totalPrice: Number(ticketType.price) * item.quantity,
          },
        });

        // Create reserved tickets
        const ticketData = Array.from({ length: item.quantity }, () => ({
          orderId: order.id,
          orderItemId: orderItem.id,
          eventId: data.eventId,
          ticketTypeId: item.ticketTypeId,
          userId,
          status: 'RESERVED' as const,
        }));

        await tx.ticket.createMany({ data: ticketData });

        // Update reserved count
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { reservedCount: { increment: item.quantity } },
        });
      }

      // Increment discount code usage if used
      if (discountCodeId) {
        await tx.discountCode.update({
          where: { id: discountCodeId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return this.getOrderById(userId, order.id, tx);
    }, {
      isolationLevel: 'Serializable',
      timeout: 30000,
    });
  }

  /**
   * Get order by ID
   */
  async getOrderById(
    userId: string,
    orderId: string,
    tx?: Prisma.TransactionClient
  ): Promise<OrderResponse> {
    const client = tx || prisma;

    const order = await client.order.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        amount: true,
        currency: true,
        subtotal: true,
        discountAmount: true,
        serviceFee: true,
        expiresAt: true,
        confirmedAt: true,
        createdAt: true,
        discountCode: {
          select: { code: true },
        },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startDate: true,
            bannerUrl: true,
            venue: {
              select: {
                name: true,
                city: true,
              },
            },
          },
        },
        orderItems: {
          select: {
            id: true,
            ticketTypeId: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            ticketType: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
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
      items: order.orderItems.map(item => ({
        id: item.id,
        ticketTypeId: item.ticketTypeId,
        ticketTypeName: item.ticketType.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      event: order.event,
      discountCode: order.discountCode?.code || null,
      expiresAt: order.expiresAt,
      confirmedAt: order.confirmedAt,
      createdAt: order.createdAt,
    };
  }

  /**
   * Confirm order after successful payment
   */
  async confirmOrder(
    userId: string,
    orderId: string,
    paymentProviderId: string,
    paymentMethod: string = 'card'
  ): Promise<{ order: OrderResponse; tickets: TicketResponse[] }> {
    return await prisma.$transaction(async (tx) => {
      // Get and lock order
      const order = await tx.order.findFirst({
        where: { id: orderId, userId },
        include: {
          orderItems: true,
          tickets: true,
        },
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (order.status !== 'pending') {
        throw new ConflictError(`Order cannot be confirmed. Current status: ${order.status}`);
      }

      if (order.expiresAt && order.expiresAt < new Date()) {
        throw new ConflictError('Order has expired');
      }

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'confirmed',
          confirmedAt: new Date(),
          paymentMethod,
          paymentProvider: 'mock',
          paymentProviderId,
          expiresAt: null, // Clear expiration
        },
      });

      // Generate QR codes for tickets and update status
      const ticketResponses: TicketResponse[] = [];

      for (const ticket of order.tickets) {
        const qrCode = generateTicketQRCode(ticket.id);

        const updatedTicket = await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            status: 'CONFIRMED',
            qrCode,
          },
          select: {
            id: true,
            qrCode: true,
            status: true,
            createdAt: true,
            ticketType: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
              },
            },
          },
        });

        ticketResponses.push({
          ...updatedTicket,
          ticketType: {
            ...updatedTicket.ticketType,
            price: Number(updatedTicket.ticketType.price),
          },
        });
      }

      // Update sold count and decrease reserved count
      for (const item of order.orderItems) {
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: {
            soldCount: { increment: item.quantity },
            reservedCount: { decrement: item.quantity },
          },
        });
      }

      // Update event attendee count
      const totalTickets = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      await tx.event.update({
        where: { id: order.eventId },
        data: { currentAttendees: { increment: totalTickets } },
      });

      // Faz 5: Get event settings for chat auto-join
      const eventForChat = await tx.event.findUnique({
        where: { id: order.eventId },
        select: { settings: true },
      });

      const orderResponse = await this.getOrderById(userId, orderId, tx);

      // Faz 5: Auto-join event chat after transaction completes
      const eventSettings = eventForChat?.settings as { allow_chat?: boolean } | null;
      if (eventSettings?.allow_chat !== false) {
        // Use setImmediate to run outside transaction (non-blocking)
        setImmediate(async () => {
          try {
            await chatService.addParticipantToEventChat(userId, order.eventId);
            console.log(`[Orders] User ${userId} added to event ${order.eventId} chat`);
          } catch (error) {
            console.error('[Orders] Failed to add user to event chat:', error);
            // Non-critical - don't fail the order
          }
        });
      }

      return {
        order: orderResponse,
        tickets: ticketResponses,
      };
    });
  }

  /**
   * Cancel a pending order
   */
  async cancelOrder(userId: string, orderId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, userId },
        include: { orderItems: true },
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      if (order.status !== 'pending') {
        throw new ConflictError('Only pending orders can be cancelled');
      }

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
        },
      });

      // Cancel tickets
      await tx.ticket.updateMany({
        where: { orderId },
        data: { status: 'CANCELLED' },
      });

      // Release reserved tickets
      for (const item of order.orderItems) {
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { reservedCount: { decrement: item.quantity } },
        });
      }

      // Decrement discount code usage if used
      if (order.discountCodeId) {
        await tx.discountCode.update({
          where: { id: order.discountCodeId },
          data: { usedCount: { decrement: 1 } },
        });
      }
    });
  }

  /**
   * Get user's orders
   */
  async getUserOrders(
    userId: string,
    query: UserOrdersQueryInput
  ): Promise<{ items: OrderResponse[]; meta: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean } }> {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { userId };
    if (status) {
      where.status = status as OrderStatus;
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
          expiresAt: true,
          confirmedAt: true,
          createdAt: true,
          discountCode: {
            select: { code: true },
          },
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              startDate: true,
              bannerUrl: true,
              venue: {
                select: {
                  name: true,
                  city: true,
                },
              },
            },
          },
          orderItems: {
            select: {
              id: true,
              ticketTypeId: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              ticketType: {
                select: { name: true },
              },
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
        items: order.orderItems.map(item => ({
          id: item.id,
          ticketTypeId: item.ticketTypeId,
          ticketTypeName: item.ticketType.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        event: order.event,
        discountCode: order.discountCode?.code || null,
        expiresAt: order.expiresAt,
        confirmedAt: order.confirmedAt,
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
}

export const ordersService = new OrdersService();
