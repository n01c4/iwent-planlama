import { prisma } from '../../../shared/database/index.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../../../shared/utils/errors.js';
import type { OrgEventsQueryInput, CreateEventInput, UpdateEventInput } from './org-events.schema.js';
import type { Prisma } from '@prisma/client';

/**
 * Generate slug from title
 */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Generate unique slug
 */
async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.event.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Organizer Event Response
 */
export interface OrgEventResponse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  bannerUrl: string | null;
  startDate: Date;
  endDate: Date | null;
  timezone: string;
  address: string | null;
  city: string | null;
  isOnline: boolean;
  onlineUrl: string | null;
  totalCapacity: number | null;
  currentAttendees: number;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  status: string;
  publishedAt: Date | null;
  settings: unknown;
  viewCount: number;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  venue: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  artists: Array<{
    id: string;
    name: string;
    slug: string;
    profilePhotoUrl: string | null;
    role: string;
  }>;
  ticketTypesCount: number;
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

class OrgEventsService {
  /**
   * Get organizer's events with filters
   */
  async getEvents(
    organizerId: string,
    query: OrgEventsQueryInput
  ): Promise<PaginatedResponse<OrgEventResponse>> {
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      organizerId,
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.EventOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

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
          description: true,
          shortDescription: true,
          bannerUrl: true,
          startDate: true,
          endDate: true,
          timezone: true,
          address: true,
          city: true,
          isOnline: true,
          onlineUrl: true,
          totalCapacity: true,
          currentAttendees: true,
          priceMin: true,
          priceMax: true,
          currency: true,
          status: true,
          publishedAt: true,
          settings: true,
          viewCount: true,
          likeCount: true,
          createdAt: true,
          updatedAt: true,
          venue: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
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
          _count: {
            select: { ticketTypes: true },
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
        artists: event.eventArtists.map((ea) => ({
          ...ea.artist,
          role: ea.role,
        })),
        ticketTypesCount: event._count.ticketTypes,
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
   * Get event by ID (for organizer)
   */
  async getEventById(organizerId: string, eventId: string): Promise<OrgEventResponse> {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId,
        deletedAt: null,
      },
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
        isOnline: true,
        onlineUrl: true,
        totalCapacity: true,
        currentAttendees: true,
        priceMin: true,
        priceMax: true,
        currency: true,
        status: true,
        publishedAt: true,
        settings: true,
        viewCount: true,
        likeCount: true,
        createdAt: true,
        updatedAt: true,
        venue: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
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
        _count: {
          select: { ticketTypes: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return {
      ...event,
      priceMin: event.priceMin ? Number(event.priceMin) : null,
      priceMax: event.priceMax ? Number(event.priceMax) : null,
      artists: event.eventArtists.map((ea) => ({
        ...ea.artist,
        role: ea.role,
      })),
      ticketTypesCount: event._count.ticketTypes,
    };
  }

  /**
   * Create new event (draft)
   */
  async createEvent(organizerId: string, data: CreateEventInput): Promise<OrgEventResponse> {
    const slug = await generateUniqueSlug(data.title);

    // Verify venue belongs to organizer (if provided)
    if (data.venueId) {
      const venue = await prisma.venue.findFirst({
        where: {
          id: data.venueId,
          managedByOrganizerId: organizerId,
        },
      });
      if (!venue) {
        throw new ForbiddenError('Venue not found or not owned by you');
      }
    }

    // Verify artists belong to organizer (if provided)
    if (data.artistIds && data.artistIds.length > 0) {
      const artists = await prisma.artist.findMany({
        where: {
          id: { in: data.artistIds },
          managedByOrganizerId: organizerId,
        },
        select: { id: true },
      });
      if (artists.length !== data.artistIds.length) {
        throw new ForbiddenError('One or more artists not found or not managed by you');
      }
    }

    const event = await prisma.event.create({
      data: {
        organizerId,
        slug,
        title: data.title,
        description: data.description,
        shortDescription: data.shortDescription,
        startDate: data.startDate,
        endDate: data.endDate,
        venueId: data.venueId,
        categoryId: data.categoryId,
        bannerUrl: data.bannerUrl,
        address: data.address,
        city: data.city,
        isOnline: data.isOnline,
        onlineUrl: data.onlineUrl,
        totalCapacity: data.totalCapacity,
        settings: data.settings || {},
        status: 'draft',
        eventArtists: data.artistIds
          ? {
              create: data.artistIds.map((artistId, index) => ({
                artistId,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      select: { id: true },
    });

    return this.getEventById(organizerId, event.id);
  }

  /**
   * Update event
   */
  async updateEvent(
    organizerId: string,
    eventId: string,
    data: UpdateEventInput
  ): Promise<OrgEventResponse> {
    const existing = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId,
        deletedAt: null,
      },
      select: { status: true, slug: true },
    });

    if (!existing) {
      throw new NotFoundError('Event not found');
    }

    // Published events have limited update fields
    if (existing.status === 'published') {
      const allowedFields = ['title', 'description', 'shortDescription', 'bannerUrl', 'settings'];
      const attemptedFields = Object.keys(data);
      const disallowedFields = attemptedFields.filter((f) => !allowedFields.includes(f));

      if (disallowedFields.length > 0) {
        throw new ForbiddenError(
          `Cannot update ${disallowedFields.join(', ')} on a published event. Unpublish first.`
        );
      }
    }

    // Generate new slug if title changed
    let slug = existing.slug;
    if (data.title) {
      slug = await generateUniqueSlug(data.title, eventId);
    }

    // Verify venue belongs to organizer (if changing)
    if (data.venueId) {
      const venue = await prisma.venue.findFirst({
        where: {
          id: data.venueId,
          managedByOrganizerId: organizerId,
        },
      });
      if (!venue) {
        throw new ForbiddenError('Venue not found or not owned by you');
      }
    }

    // Handle artist updates
    if (data.artistIds !== undefined) {
      // Verify artists belong to organizer
      if (data.artistIds.length > 0) {
        const artists = await prisma.artist.findMany({
          where: {
            id: { in: data.artistIds },
            managedByOrganizerId: organizerId,
          },
          select: { id: true },
        });
        if (artists.length !== data.artistIds.length) {
          throw new ForbiddenError('One or more artists not found or not managed by you');
        }
      }

      // Delete existing and create new
      await prisma.eventArtist.deleteMany({ where: { eventId } });
      if (data.artistIds.length > 0) {
        await prisma.eventArtist.createMany({
          data: data.artistIds.map((artistId, index) => ({
            eventId,
            artistId,
            sortOrder: index,
          })),
        });
      }
    }

    // Update event
    await prisma.event.update({
      where: { id: eventId },
      data: {
        slug,
        title: data.title,
        description: data.description,
        shortDescription: data.shortDescription,
        startDate: data.startDate,
        endDate: data.endDate,
        venueId: data.venueId,
        categoryId: data.categoryId,
        bannerUrl: data.bannerUrl,
        address: data.address,
        city: data.city,
        isOnline: data.isOnline,
        onlineUrl: data.onlineUrl,
        totalCapacity: data.totalCapacity,
        settings: data.settings,
      },
    });

    return this.getEventById(organizerId, eventId);
  }

  /**
   * Delete event (soft delete)
   */
  async deleteEvent(organizerId: string, eventId: string): Promise<void> {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId,
        deletedAt: null,
      },
      select: { status: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.status === 'published') {
      throw new ForbiddenError('Cannot delete a published event. Unpublish first.');
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Publish event
   */
  async publishEvent(organizerId: string, eventId: string): Promise<OrgEventResponse> {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId,
        deletedAt: null,
      },
      select: {
        status: true,
        title: true,
        startDate: true,
        _count: { select: { ticketTypes: true } },
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.status === 'published') {
      throw new ConflictError('Event is already published');
    }

    if (event.status === 'cancelled') {
      throw new ForbiddenError('Cannot publish a cancelled event');
    }

    // Validate event is ready to publish
    if (event.startDate < new Date()) {
      throw new ForbiddenError('Cannot publish an event with a start date in the past');
    }

    await prisma.event.update({
      where: { id: eventId },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });

    return this.getEventById(organizerId, eventId);
  }

  /**
   * Unpublish event
   */
  async unpublishEvent(organizerId: string, eventId: string): Promise<OrgEventResponse> {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId,
        deletedAt: null,
      },
      select: { status: true },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (event.status !== 'published') {
      throw new ConflictError('Event is not published');
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { status: 'unpublished' },
    });

    return this.getEventById(organizerId, eventId);
  }

  /**
   * Duplicate event
   */
  async duplicateEvent(organizerId: string, eventId: string): Promise<OrgEventResponse> {
    const original = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId,
        deletedAt: null,
      },
      include: {
        eventArtists: true,
        ticketTypes: true,
      },
    });

    if (!original) {
      throw new NotFoundError('Event not found');
    }

    const newSlug = await generateUniqueSlug(`${original.title} Copy`);

    // Create duplicate event
    const duplicate = await prisma.event.create({
      data: {
        organizerId,
        slug: newSlug,
        title: `${original.title} (Copy)`,
        description: original.description,
        shortDescription: original.shortDescription,
        startDate: original.startDate,
        endDate: original.endDate,
        timezone: original.timezone,
        venueId: original.venueId,
        categoryId: original.categoryId,
        bannerUrl: original.bannerUrl,
        address: original.address,
        city: original.city,
        isOnline: original.isOnline,
        onlineUrl: original.onlineUrl,
        totalCapacity: original.totalCapacity,
        settings: original.settings as any,
        status: 'draft',
        eventArtists: {
          create: original.eventArtists.map((ea) => ({
            artistId: ea.artistId,
            role: ea.role,
            sortOrder: ea.sortOrder,
          })),
        },
        ticketTypes: {
          create: original.ticketTypes.map((tt) => ({
            name: tt.name,
            description: tt.description,
            price: tt.price,
            currency: tt.currency,
            capacity: tt.capacity,
            minPerOrder: tt.minPerOrder,
            maxPerOrder: tt.maxPerOrder,
            isActive: tt.isActive,
            sortOrder: tt.sortOrder,
          })),
        },
      },
      select: { id: true },
    });

    return this.getEventById(organizerId, duplicate.id);
  }
}

export const orgEventsService = new OrgEventsService();
