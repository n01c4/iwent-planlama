import { prisma } from '../../../shared/database/index.js';
import { NotFoundError, ForbiddenError } from '../../../shared/utils/errors.js';
import type { CreateArtistInput, UpdateArtistInput, OrgArtistsQueryInput } from './org-artists.schema.js';
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
    const existing = await prisma.artist.findUnique({
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
 * Artist Response
 */
export interface ArtistResponse {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  profilePhotoUrl: string | null;
  coverPhotoUrl: string | null;
  gallery: unknown;
  website: string | null;
  socialLinks: unknown;
  genres: unknown;
  tags: unknown;
  followerCount: number;
  eventCount: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class OrgArtistsService {
  /**
   * Get organizer's artists
   */
  async getArtists(organizerId: string, query: OrgArtistsQueryInput): Promise<ArtistResponse[]> {
    const where: Prisma.ArtistWhereInput = {
      managedByOrganizerId: organizerId,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { bio: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const artists = await prisma.artist.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        profilePhotoUrl: true,
        coverPhotoUrl: true,
        gallery: true,
        website: true,
        socialLinks: true,
        genres: true,
        tags: true,
        followerCount: true,
        eventCount: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return artists;
  }

  /**
   * Create artist
   */
  async createArtist(organizerId: string, data: CreateArtistInput): Promise<ArtistResponse> {
    const slug = await generateUniqueSlug(data.name);

    const artist = await prisma.artist.create({
      data: {
        managedByOrganizerId: organizerId,
        name: data.name,
        slug,
        bio: data.bio,
        profilePhotoUrl: data.profilePhotoUrl,
        coverPhotoUrl: data.coverPhotoUrl,
        website: data.website,
        socialLinks: data.socialLinks || {},
        genres: data.genres || [],
        tags: data.tags || [],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        profilePhotoUrl: true,
        coverPhotoUrl: true,
        gallery: true,
        website: true,
        socialLinks: true,
        genres: true,
        tags: true,
        followerCount: true,
        eventCount: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return artist;
  }

  /**
   * Update artist
   */
  async updateArtist(
    organizerId: string,
    artistId: string,
    data: UpdateArtistInput
  ): Promise<ArtistResponse> {
    const existing = await prisma.artist.findFirst({
      where: {
        id: artistId,
        managedByOrganizerId: organizerId,
      },
      select: { slug: true },
    });

    if (!existing) {
      throw new NotFoundError('Artist not found');
    }

    // Generate new slug if name changed
    let slug = existing.slug;
    if (data.name) {
      slug = await generateUniqueSlug(data.name, artistId);
    }

    const artist = await prisma.artist.update({
      where: { id: artistId },
      data: {
        name: data.name,
        slug,
        bio: data.bio,
        profilePhotoUrl: data.profilePhotoUrl,
        coverPhotoUrl: data.coverPhotoUrl,
        website: data.website,
        socialLinks: data.socialLinks,
        genres: data.genres,
        tags: data.tags,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        profilePhotoUrl: true,
        coverPhotoUrl: true,
        gallery: true,
        website: true,
        socialLinks: true,
        genres: true,
        tags: true,
        followerCount: true,
        eventCount: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return artist;
  }

  /**
   * Delete artist
   */
  async deleteArtist(organizerId: string, artistId: string): Promise<void> {
    const artist = await prisma.artist.findFirst({
      where: {
        id: artistId,
        managedByOrganizerId: organizerId,
      },
      select: {
        id: true,
        _count: {
          select: {
            eventArtists: {
              where: {
                event: { deletedAt: null },
              },
            },
          },
        },
      },
    });

    if (!artist) {
      throw new NotFoundError('Artist not found');
    }

    if (artist._count.eventArtists > 0) {
      throw new ForbiddenError(
        'Cannot delete artist that is assigned to events. Remove from events first.'
      );
    }

    await prisma.artist.delete({
      where: { id: artistId },
    });
  }
}

export const orgArtistsService = new OrgArtistsService();
