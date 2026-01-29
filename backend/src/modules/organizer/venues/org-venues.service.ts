import { prisma } from '../../../shared/database/index.js';
import { NotFoundError, ForbiddenError } from '../../../shared/utils/errors.js';
import type { CreateVenueInput, UpdateVenueInput, OrgVenuesQueryInput } from './org-venues.schema.js';
import type { Prisma } from '@prisma/client';

/**
 * Generate slug from name
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
async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.venue.findUnique({
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
 * Venue Response
 */
export interface VenueResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  address: string | null;
  postalCode: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  profilePhotoUrl: string | null;
  coverPhotoUrl: string | null;
  gallery: unknown;
  capacity: number | null;
  amenities: unknown;
  phone: string | null;
  email: string | null;
  website: string | null;
  socialLinks: unknown;
  operatingHours: unknown;
  isVerified: boolean;
  eventCount: number;
  createdAt: Date;
  updatedAt: Date;
}

class OrgVenuesService {
  /**
   * Get organizer's venues
   */
  async getVenues(organizerId: string, query: OrgVenuesQueryInput): Promise<VenueResponse[]> {
    const where: Prisma.VenueWhereInput = {
      managedByOrganizerId: organizerId,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const venues = await prisma.venue.findMany({
      where,
      orderBy: { name: 'asc' },
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
        isVerified: true,
        eventCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return venues.map((venue) => ({
      ...venue,
      latitude: venue.latitude ? Number(venue.latitude) : null,
      longitude: venue.longitude ? Number(venue.longitude) : null,
    }));
  }

  /**
   * Create venue
   */
  async createVenue(organizerId: string, data: CreateVenueInput): Promise<VenueResponse> {
    const slug = await generateUniqueSlug(data.name);

    const venue = await prisma.venue.create({
      data: {
        managedByOrganizerId: organizerId,
        name: data.name,
        slug,
        description: data.description,
        city: data.city,
        address: data.address,
        postalCode: data.postalCode,
        latitude: data.latitude,
        longitude: data.longitude,
        profilePhotoUrl: data.profilePhotoUrl,
        coverPhotoUrl: data.coverPhotoUrl,
        capacity: data.capacity,
        amenities: data.amenities || [],
        phone: data.phone,
        email: data.email,
        website: data.website,
        socialLinks: data.socialLinks || {},
        operatingHours: data.operatingHours || {},
      },
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
        isVerified: true,
        eventCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...venue,
      latitude: venue.latitude ? Number(venue.latitude) : null,
      longitude: venue.longitude ? Number(venue.longitude) : null,
    };
  }

  /**
   * Update venue
   */
  async updateVenue(
    organizerId: string,
    venueId: string,
    data: UpdateVenueInput
  ): Promise<VenueResponse> {
    const existing = await prisma.venue.findFirst({
      where: {
        id: venueId,
        managedByOrganizerId: organizerId,
      },
      select: { slug: true },
    });

    if (!existing) {
      throw new NotFoundError('Venue not found');
    }

    // Generate new slug if name changed
    let slug = existing.slug;
    if (data.name) {
      slug = await generateUniqueSlug(data.name, venueId);
    }

    const venue = await prisma.venue.update({
      where: { id: venueId },
      data: {
        name: data.name,
        slug,
        description: data.description,
        city: data.city,
        address: data.address,
        postalCode: data.postalCode,
        latitude: data.latitude,
        longitude: data.longitude,
        profilePhotoUrl: data.profilePhotoUrl,
        coverPhotoUrl: data.coverPhotoUrl,
        capacity: data.capacity,
        amenities: data.amenities,
        phone: data.phone,
        email: data.email,
        website: data.website,
        socialLinks: data.socialLinks,
        operatingHours: data.operatingHours,
      },
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
        isVerified: true,
        eventCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...venue,
      latitude: venue.latitude ? Number(venue.latitude) : null,
      longitude: venue.longitude ? Number(venue.longitude) : null,
    };
  }

  /**
   * Delete venue
   */
  async deleteVenue(organizerId: string, venueId: string): Promise<void> {
    const venue = await prisma.venue.findFirst({
      where: {
        id: venueId,
        managedByOrganizerId: organizerId,
      },
      select: {
        id: true,
        _count: {
          select: { events: { where: { deletedAt: null } } },
        },
      },
    });

    if (!venue) {
      throw new NotFoundError('Venue not found');
    }

    if (venue._count.events > 0) {
      throw new ForbiddenError(
        'Cannot delete venue that has events. Remove or reassign events first.'
      );
    }

    await prisma.venue.delete({
      where: { id: venueId },
    });
  }
}

export const orgVenuesService = new OrgVenuesService();
