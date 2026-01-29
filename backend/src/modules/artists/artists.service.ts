import { prisma } from '../../shared/database/index.js';
import { NotFoundError, ConflictError } from '../../shared/utils/errors.js';
import type { ArtistsQueryInput, ArtistEventsQueryInput, FollowedArtistsQueryInput } from './artists.schema.js';
import type { Prisma } from '@prisma/client';

/**
 * Artist Summary Response
 */
export interface ArtistSummary {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  profilePhotoUrl: string | null;
  genres: unknown;
  followerCount: number;
  eventCount: number;
  isVerified: boolean;
}

/**
 * Artist Detail Response
 */
export interface ArtistDetail extends ArtistSummary {
  coverPhotoUrl: string | null;
  gallery: unknown;
  website: string | null;
  socialLinks: unknown;
  tags: unknown;
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

class ArtistsService {
  /**
   * Get paginated list of artists
   * OpenAPI compliant: search, genre
   */
  async getArtists(query: ArtistsQueryInput): Promise<PaginatedResponse<ArtistSummary>> {
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ArtistWhereInput = {};

    // Search filter (name, bio)
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { bio: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Genre filter - For PostgreSQL JSON arrays, use path array_contains
    // Note: Prisma's Json filter with string_contains searches within serialized JSON
    if (filters.genre) {
      where.genres = {
        array_contains: filters.genre,
      };
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    const orderBy: Prisma.ArtistOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [artists, total] = await Promise.all([
      prisma.artist.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          bio: true,
          profilePhotoUrl: true,
          genres: true,
          followerCount: true,
          eventCount: true,
          isVerified: true,
        },
      }),
      prisma.artist.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: artists,
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
   * Get artist by ID
   */
  async getArtistById(id: string): Promise<ArtistDetail> {
    const artist = await prisma.artist.findUnique({
      where: { id },
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
      },
    });

    if (!artist) {
      throw new NotFoundError('Artist not found');
    }

    return artist;
  }

  /**
   * Get artist by slug
   */
  async getArtistBySlug(slug: string): Promise<ArtistDetail> {
    const artist = await prisma.artist.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!artist) {
      throw new NotFoundError('Artist not found');
    }

    return this.getArtistById(artist.id);
  }

  /**
   * Get events featuring an artist
   */
  async getArtistEvents(
    artistId: string,
    query: ArtistEventsQueryInput
  ): Promise<PaginatedResponse<{
    id: string;
    slug: string;
    title: string;
    bannerUrl: string | null;
    startDate: Date;
    city: string | null;
    priceMin: number | null;
    role: string;
    venue: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }>> {
    // Verify artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true },
    });

    if (!artist) {
      throw new NotFoundError('Artist not found');
    }

    const { page, limit, upcoming } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EventArtistWhereInput = {
      artistId,
      event: {
        deletedAt: null,
        status: 'published',
        ...(upcoming ? { startDate: { gte: new Date() } } : {}),
      },
    };

    const [eventArtists, total] = await Promise.all([
      prisma.eventArtist.findMany({
        where,
        orderBy: { event: { startDate: upcoming ? 'asc' : 'desc' } },
        skip,
        take: limit,
        select: {
          role: true,
          event: {
            select: {
              id: true,
              slug: true,
              title: true,
              bannerUrl: true,
              startDate: true,
              city: true,
              priceMin: true,
              venue: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      }),
      prisma.eventArtist.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: eventArtists.map((ea) => ({
        id: ea.event.id,
        slug: ea.event.slug,
        title: ea.event.title,
        bannerUrl: ea.event.bannerUrl,
        startDate: ea.event.startDate,
        city: ea.event.city,
        priceMin: ea.event.priceMin ? Number(ea.event.priceMin) : null,
        role: ea.role,
        venue: ea.event.venue,
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

  // ===========================================================================
  // FOLLOWING METHODS (Faz 5)
  // ===========================================================================

  /**
   * Follow an artist
   */
  async followArtist(userId: string, artistId: string): Promise<{ followerCount: number }> {
    // Check artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true, followerCount: true },
    });

    if (!artist) {
      throw new NotFoundError('Artist not found');
    }

    // Check if already following
    const existing = await prisma.artistFollower.findUnique({
      where: { artistId_userId: { artistId, userId } },
    });

    if (existing) {
      throw new ConflictError('Already following this artist');
    }

    // Create follow and increment count
    await prisma.$transaction([
      prisma.artistFollower.create({
        data: { artistId, userId },
      }),
      prisma.artist.update({
        where: { id: artistId },
        data: { followerCount: { increment: 1 } },
      }),
    ]);

    return { followerCount: artist.followerCount + 1 };
  }

  /**
   * Unfollow an artist
   */
  async unfollowArtist(userId: string, artistId: string): Promise<void> {
    // Check if following
    const existing = await prisma.artistFollower.findUnique({
      where: { artistId_userId: { artistId, userId } },
    });

    if (!existing) {
      throw new NotFoundError('Not following this artist');
    }

    // Delete follow and decrement count
    await prisma.$transaction([
      prisma.artistFollower.delete({
        where: { id: existing.id },
      }),
      prisma.artist.update({
        where: { id: artistId },
        data: { followerCount: { decrement: 1 } },
      }),
    ]);
  }

  /**
   * Get user's followed artists
   */
  async getFollowedArtists(
    userId: string,
    query: FollowedArtistsQueryInput
  ): Promise<PaginatedResponse<ArtistSummary & { followedAt: Date }>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      prisma.artistFollower.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              slug: true,
              bio: true,
              profilePhotoUrl: true,
              genres: true,
              followerCount: true,
              eventCount: true,
              isVerified: true,
            },
          },
        },
      }),
      prisma.artistFollower.count({ where: { userId } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: follows.map((f) => ({
        ...f.artist,
        followedAt: f.createdAt,
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
   * Check if user follows an artist
   */
  async isFollowingArtist(userId: string, artistId: string): Promise<boolean> {
    const follow = await prisma.artistFollower.findUnique({
      where: { artistId_userId: { artistId, userId } },
    });
    return !!follow;
  }
}

export const artistsService = new ArtistsService();
