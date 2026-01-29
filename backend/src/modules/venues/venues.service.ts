import { prisma } from '../../shared/database/index.js';
import { NotFoundError } from '../../shared/utils/errors.js';
import type { VenuesQueryInput, VenueEventsQueryInput } from './venues.schema.js';
import type { Prisma } from '@prisma/client';

/**
 * Venue Summary Response
 */
export interface VenueSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  profilePhotoUrl: string | null;
  capacity: number | null;
  eventCount: number;
  averageRating: number;
  reviewCount: number;
  isVerified: boolean;
}

/**
 * Venue Detail Response
 */
export interface VenueDetail extends VenueSummary {
  address: string | null;
  postalCode: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  coverPhotoUrl: string | null;
  gallery: unknown;
  amenities: unknown;
  phone: string | null;
  email: string | null;
  website: string | null;
  socialLinks: unknown;
  operatingHours: unknown;
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

class VenuesService {
  /**
   * Get paginated list of venues
   * OpenAPI compliant: search, city
   */
  async getVenues(query: VenuesQueryInput): Promise<PaginatedResponse<VenueSummary>> {
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.VenueWhereInput = {};

    // Search filter (name, description)
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters.capacityMin !== undefined || filters.capacityMax !== undefined) {
      where.capacity = {};
      if (filters.capacityMin !== undefined) {
        where.capacity.gte = filters.capacityMin;
      }
      if (filters.capacityMax !== undefined) {
        where.capacity.lte = filters.capacityMax;
      }
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    const orderBy: Prisma.VenueOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [venues, total] = await Promise.all([
      prisma.venue.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          city: true,
          profilePhotoUrl: true,
          capacity: true,
          eventCount: true,
          averageRating: true,
          reviewCount: true,
          isVerified: true,
        },
      }),
      prisma.venue.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: venues.map((venue) => ({
        ...venue,
        averageRating: Number(venue.averageRating),
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
   * Get venue by ID
   */
  async getVenueById(id: string): Promise<VenueDetail> {
    const venue = await prisma.venue.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        city: true,
        address: true,
        postalCode: true,
        country: true,
        latitude: true,
        longitude: true,
        profilePhotoUrl: true,
        coverPhotoUrl: true,
        gallery: true,
        capacity: true,
        amenities: true,
        phone: true,
        email: true,
        website: true,
        socialLinks: true,
        operatingHours: true,
        eventCount: true,
        averageRating: true,
        reviewCount: true,
        isVerified: true,
      },
    });

    if (!venue) {
      throw new NotFoundError('Venue not found');
    }

    return {
      ...venue,
      averageRating: Number(venue.averageRating),
      latitude: venue.latitude ? Number(venue.latitude) : null,
      longitude: venue.longitude ? Number(venue.longitude) : null,
    };
  }

  /**
   * Get venue by slug
   */
  async getVenueBySlug(slug: string): Promise<VenueDetail> {
    const venue = await prisma.venue.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!venue) {
      throw new NotFoundError('Venue not found');
    }

    return this.getVenueById(venue.id);
  }

  /**
   * Get events at a venue
   */
  async getVenueEvents(
    venueId: string,
    query: VenueEventsQueryInput
  ): Promise<PaginatedResponse<{
    id: string;
    slug: string;
    title: string;
    bannerUrl: string | null;
    startDate: Date;
    priceMin: number | null;
    status: string;
  }>> {
    // Verify venue exists
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true },
    });

    if (!venue) {
      throw new NotFoundError('Venue not found');
    }

    const { page, limit, upcoming } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      venueId,
      deletedAt: null,
      status: 'published',
    };

    if (upcoming) {
      where.startDate = { gte: new Date() };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { startDate: upcoming ? 'asc' : 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          bannerUrl: true,
          startDate: true,
          priceMin: true,
          status: true,
        },
      }),
      prisma.event.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: events.map((event) => ({
        ...event,
        priceMin: event.priceMin ? Number(event.priceMin) : null,
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

export const venuesService = new VenuesService();
