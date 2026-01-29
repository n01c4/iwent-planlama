import { prisma } from '../../shared/database/index.js';
import { NotFoundError } from '../../shared/utils/errors.js';
import type { EventsQueryInput, EventAttendeesQueryInput } from './events.schema.js';
import type { Prisma } from '@prisma/client';

/**
 * Event Summary Response
 */
export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  bannerUrl: string | null;
  startDate: Date;
  endDate: Date | null;
  city: string | null;
  isOnline: boolean;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  status: string;
  likeCount: number;
  viewCount: number;
  venue: {
    id: string;
    name: string;
    slug: string;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
  } | null;
}

/**
 * Event Detail Response
 */
export interface EventDetail extends EventSummary {
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  onlineUrl: string | null;
  totalCapacity: number | null;
  currentAttendees: number;
  timezone: string;
  settings: unknown;
  organizer: {
    id: string;
    businessName: string | null;
    logoUrl: string | null;
    isVerified: boolean;
  };
  artists: Array<{
    id: string;
    name: string;
    slug: string;
    profilePhotoUrl: string | null;
    role: string;
  }>;
  photos: Array<{
    id: string;
    url: string;
    caption: string | null;
  }>;
}

/**
 * Ticket Type Response
 */
export interface TicketTypeSummary {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  capacity: number;
  soldCount: number;
  available: number;
  saleStartDate: Date | null;
  saleEndDate: Date | null;
  minPerOrder: number;
  maxPerOrder: number;
  isActive: boolean;
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

class EventsService {
  /**
   * Get paginated list of events with filters
   * OpenAPI compliant: search, city, category, artistId, venueId, dateFrom, dateTo
   *
   * IMPORTANT: Only status='published' AND start_date > NOW() are "Active" events
   * deleted_at must be NULL (soft delete compliance)
   */
  async getEvents(query: EventsQueryInput): Promise<PaginatedResponse<EventSummary>> {
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    const skip = (page - 1) * limit;

    // Build where clause - ALWAYS exclude soft deleted
    const where: Prisma.EventWhereInput = {
      deletedAt: null,
    };

    // Only show published + future events for public API (Active events rule)
    if (!filters.status) {
      where.status = 'published';
      where.startDate = { gte: new Date() }; // Active = published + future
    } else {
      where.status = filters.status;
    }

    // Search filter (title, description)
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Category filters (OpenAPI: category param is slug)
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    } else if (filters.category || filters.categorySlug) {
      where.category = { slug: filters.category || filters.categorySlug };
    }

    // City filter
    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    // Venue filter
    if (filters.venueId) {
      where.venueId = filters.venueId;
    }

    // Artist filter (requires join through EventArtist)
    if (filters.artistId) {
      where.eventArtists = {
        some: { artistId: filters.artistId },
      };
    }

    // Date range (OpenAPI: dateFrom, dateTo - legacy: startDateFrom, startDateTo)
    const dateFrom = filters.dateFrom || filters.startDateFrom;
    const dateTo = filters.dateTo || filters.startDateTo;
    if (dateFrom || dateTo) {
      // Override the default future-only filter if explicit date range provided
      where.startDate = {};
      if (dateFrom) {
        where.startDate.gte = dateFrom;
      }
      if (dateTo) {
        where.startDate.lte = dateTo;
      }
    }

    // Price filter
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      where.priceMin = {};
      if (filters.priceMin !== undefined) {
        where.priceMin.gte = filters.priceMin;
      }
      if (filters.priceMax !== undefined) {
        where.priceMax = { lte: filters.priceMax };
      }
    }

    // Online filter
    if (filters.isOnline !== undefined) {
      where.isOnline = filters.isOnline;
    }

    // Build orderBy
    const orderBy: Prisma.EventOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Execute query
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          shortDescription: true,
          bannerUrl: true,
          startDate: true,
          endDate: true,
          city: true,
          isOnline: true,
          priceMin: true,
          priceMax: true,
          currency: true,
          status: true,
          likeCount: true,
          viewCount: true,
          venue: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: events.map((event) => ({
        ...event,
        priceMin: event.priceMin ? Number(event.priceMin) : null,
        priceMax: event.priceMax ? Number(event.priceMax) : null,
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
   * Get event by ID
   */
  async getEventById(id: string): Promise<EventDetail> {
    const event = await prisma.event.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        shortDescription: true,
        bannerUrl: true,
        startDate: true,
        endDate: true,
        timezone: true,
        address: true,
        city: true,
        latitude: true,
        longitude: true,
        isOnline: true,
        onlineUrl: true,
        totalCapacity: true,
        currentAttendees: true,
        priceMin: true,
        priceMax: true,
        currency: true,
        status: true,
        settings: true,
        likeCount: true,
        viewCount: true,
        venue: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        organizer: {
          select: {
            id: true,
            businessName: true,
            logoUrl: true,
            isVerified: true,
          },
        },
        eventArtists: {
          orderBy: { sortOrder: 'asc' },
          select: {
            role: true,
            artist: {
              select: {
                id: true,
                name: true,
                slug: true,
                profilePhotoUrl: true,
              },
            },
          },
        },
        eventPhotos: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            url: true,
            caption: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Increment view count (fire and forget)
    prisma.event.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    return {
      ...event,
      priceMin: event.priceMin ? Number(event.priceMin) : null,
      priceMax: event.priceMax ? Number(event.priceMax) : null,
      latitude: event.latitude ? Number(event.latitude) : null,
      longitude: event.longitude ? Number(event.longitude) : null,
      artists: event.eventArtists.map((ea) => ({
        ...ea.artist,
        role: ea.role,
      })),
      photos: event.eventPhotos,
    };
  }

  /**
   * Get event by slug
   */
  async getEventBySlug(slug: string): Promise<EventDetail> {
    const event = await prisma.event.findUnique({
      where: { slug, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return this.getEventById(event.id);
  }

  /**
   * Get ticket types for an event
   */
  async getEventTicketTypes(eventId: string): Promise<TicketTypeSummary[]> {
    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const ticketTypes = await prisma.ticketType.findMany({
      where: {
        eventId,
        isActive: true,
      },
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
      },
    });

    return ticketTypes.map((tt) => ({
      ...tt,
      price: Number(tt.price),
      available: tt.capacity - tt.soldCount - tt.reservedCount,
    }));
  }

  // ===========================================================================
  // EVENT SOCIAL ENDPOINTS (Faz 5)
  // ===========================================================================

  /**
   * Get event attendees (users with CONFIRMED tickets)
   */
  async getEventAttendees(
    eventId: string,
    viewerId: string | null,
    query: EventAttendeesQueryInput
  ): Promise<PaginatedResponse<{
    id: string;
    name: string | null;
    avatarUrl: string | null;
    isFriend: boolean;
  }>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Get confirmed tickets with unique users
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: {
          eventId,
          status: 'CONFIRMED',
        },
        distinct: ['userId'],
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.ticket.groupBy({
        by: ['userId'],
        where: {
          eventId,
          status: 'CONFIRMED',
        },
      }).then((groups) => groups.length),
    ]);

    // Get friends list if viewer is authenticated
    let friendIds: Set<string> = new Set();
    if (viewerId) {
      const friendships = await prisma.friendship.findMany({
        where: {
          status: 'accepted',
          OR: [{ requesterId: viewerId }, { addresseeId: viewerId }],
        },
        select: { requesterId: true, addresseeId: true },
      });

      friendIds = new Set(
        friendships.flatMap((f) =>
          f.requesterId === viewerId ? [f.addresseeId] : [f.requesterId]
        )
      );
    }

    const totalPages = Math.ceil(total / limit);

    return {
      items: tickets.map((t) => ({
        id: t.user.id,
        name: t.user.name,
        avatarUrl: t.user.avatarUrl,
        isFriend: friendIds.has(t.user.id),
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
   * Get event social info
   */
  async getEventSocial(
    eventId: string,
    viewerId: string | null
  ): Promise<{
    chatRoomId: string | null;
    attendeeCount: number;
    friendsAttending: Array<{
      id: string;
      name: string | null;
      avatarUrl: string | null;
    }>;
    likeCount: number;
    isLiked: boolean;
  }> {
    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId, deletedAt: null },
      select: {
        id: true,
        likeCount: true,
        currentAttendees: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Get chat room
    const chatRoom = await prisma.chatRoom.findFirst({
      where: { eventId, type: 'event' },
      select: { id: true },
    });

    // Check if liked by viewer
    let isLiked = false;
    if (viewerId) {
      const like = await prisma.userLike.findUnique({
        where: { userId_eventId: { userId: viewerId, eventId } },
      });
      isLiked = !!like;
    }

    // Get friends attending
    let friendsAttending: Array<{ id: string; name: string | null; avatarUrl: string | null }> = [];
    if (viewerId) {
      // Get viewer's friends
      const friendships = await prisma.friendship.findMany({
        where: {
          status: 'accepted',
          OR: [{ requesterId: viewerId }, { addresseeId: viewerId }],
        },
        select: { requesterId: true, addresseeId: true },
      });

      const friendIds = friendships.map((f) =>
        f.requesterId === viewerId ? f.addresseeId : f.requesterId
      );

      if (friendIds.length > 0) {
        // Find friends with confirmed tickets
        const friendsWithTickets = await prisma.ticket.findMany({
          where: {
            eventId,
            status: 'CONFIRMED',
            userId: { in: friendIds },
          },
          distinct: ['userId'],
          take: 10,
          select: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        });

        friendsAttending = friendsWithTickets.map((t) => t.user);
      }
    }

    return {
      chatRoomId: chatRoom?.id || null,
      attendeeCount: event.currentAttendees,
      friendsAttending,
      likeCount: event.likeCount,
      isLiked,
    };
  }
}

export const eventsService = new EventsService();
