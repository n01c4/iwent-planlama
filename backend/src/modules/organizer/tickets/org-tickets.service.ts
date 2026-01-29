import { prisma } from '../../../shared/database/index.js';
import { NotFoundError, ForbiddenError } from '../../../shared/utils/errors.js';
import type { CreateTicketTypeInput, UpdateTicketTypeInput } from './org-tickets.schema.js';

/**
 * Ticket Type Response
 */
export interface TicketTypeResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  capacity: number;
  soldCount: number;
  reservedCount: number;
  available: number;
  saleStartDate: Date | null;
  saleEndDate: Date | null;
  minPerOrder: number;
  maxPerOrder: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Update event price range after ticket type changes
 */
async function updateEventPriceRange(eventId: string): Promise<void> {
  const ticketTypes = await prisma.ticketType.findMany({
    where: { eventId, isActive: true },
    select: { price: true },
  });

  if (ticketTypes.length === 0) {
    await prisma.event.update({
      where: { id: eventId },
      data: { priceMin: null, priceMax: null },
    });
    return;
  }

  const prices = ticketTypes.map((tt) => Number(tt.price));
  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);

  await prisma.event.update({
    where: { id: eventId },
    data: { priceMin, priceMax },
  });
}

class OrgTicketsService {
  /**
   * Get ticket types for an event
   */
  async getTicketTypes(organizerId: string, eventId: string): Promise<TicketTypeResponse[]> {
    // Verify event belongs to organizer
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const ticketTypes = await prisma.ticketType.findMany({
      where: { eventId },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        currency: true,
        capacity: true,
        soldCount: true,
        reservedCount: true,
        saleStartDate: true,
        saleEndDate: true,
        minPerOrder: true,
        maxPerOrder: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return ticketTypes.map((tt) => ({
      ...tt,
      price: Number(tt.price),
      available: tt.capacity - tt.soldCount - tt.reservedCount,
    }));
  }

  /**
   * Create ticket type for an event
   */
  async createTicketType(
    organizerId: string,
    eventId: string,
    data: CreateTicketTypeInput
  ): Promise<TicketTypeResponse> {
    // Verify event belongs to organizer
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const ticketType = await prisma.ticketType.create({
      data: {
        eventId,
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency,
        capacity: data.capacity,
        saleStartDate: data.saleStartDate,
        saleEndDate: data.saleEndDate,
        minPerOrder: data.minPerOrder,
        maxPerOrder: data.maxPerOrder,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        currency: true,
        capacity: true,
        soldCount: true,
        reservedCount: true,
        saleStartDate: true,
        saleEndDate: true,
        minPerOrder: true,
        maxPerOrder: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Update event price range
    await updateEventPriceRange(eventId);

    return {
      ...ticketType,
      price: Number(ticketType.price),
      available: ticketType.capacity - ticketType.soldCount - ticketType.reservedCount,
    };
  }

  /**
   * Update ticket type
   */
  async updateTicketType(
    organizerId: string,
    ticketTypeId: string,
    data: UpdateTicketTypeInput
  ): Promise<TicketTypeResponse> {
    // Verify ticket type belongs to organizer's event
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      select: {
        id: true,
        eventId: true,
        soldCount: true,
        event: {
          select: { organizerId: true },
        },
      },
    });

    if (!ticketType) {
      throw new NotFoundError('Ticket type not found');
    }

    if (ticketType.event.organizerId !== organizerId) {
      throw new ForbiddenError('You do not have permission to update this ticket type');
    }

    // If tickets have been sold, restrict certain updates
    if (ticketType.soldCount > 0) {
      if (data.price !== undefined || data.capacity !== undefined) {
        throw new ForbiddenError(
          'Cannot change price or capacity after tickets have been sold'
        );
      }
    }

    const updated = await prisma.ticketType.update({
      where: { id: ticketTypeId },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        capacity: data.capacity,
        saleStartDate: data.saleStartDate,
        saleEndDate: data.saleEndDate,
        minPerOrder: data.minPerOrder,
        maxPerOrder: data.maxPerOrder,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        currency: true,
        capacity: true,
        soldCount: true,
        reservedCount: true,
        saleStartDate: true,
        saleEndDate: true,
        minPerOrder: true,
        maxPerOrder: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Update event price range if price or isActive changed
    if (data.price !== undefined || data.isActive !== undefined) {
      await updateEventPriceRange(ticketType.eventId);
    }

    return {
      ...updated,
      price: Number(updated.price),
      available: updated.capacity - updated.soldCount - updated.reservedCount,
    };
  }

  /**
   * Delete ticket type
   */
  async deleteTicketType(organizerId: string, ticketTypeId: string): Promise<void> {
    // Verify ticket type belongs to organizer's event
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      select: {
        id: true,
        eventId: true,
        soldCount: true,
        event: {
          select: { organizerId: true },
        },
      },
    });

    if (!ticketType) {
      throw new NotFoundError('Ticket type not found');
    }

    if (ticketType.event.organizerId !== organizerId) {
      throw new ForbiddenError('You do not have permission to delete this ticket type');
    }

    if (ticketType.soldCount > 0) {
      throw new ForbiddenError('Cannot delete ticket type that has sold tickets');
    }

    await prisma.ticketType.delete({
      where: { id: ticketTypeId },
    });

    // Update event price range
    await updateEventPriceRange(ticketType.eventId);
  }
}

export const orgTicketsService = new OrgTicketsService();
