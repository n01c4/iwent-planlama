import { prisma } from '../../shared/database/index.js';
import type { SearchQueryInput } from './search.schema.js';

/**
 * Search Result Item
 */
export interface SearchResultItem {
  type: 'event' | 'venue' | 'artist';
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  city: string | null;
  extra?: Record<string, unknown>;
}

/**
 * Search Results Response
 */
export interface SearchResults {
  events: SearchResultItem[];
  venues: SearchResultItem[];
  artists: SearchResultItem[];
  total: number;
}

class SearchService {
  /**
   * Search across events, venues, and artists
   */
  async search(query: SearchQueryInput): Promise<SearchResults> {
    const { q, type, limit, city } = query;
    const searchTerm = `%${q}%`;

    const results: SearchResults = {
      events: [],
      venues: [],
      artists: [],
      total: 0,
    };

    // Search Events
    if (type === 'all' || type === 'events') {
      const events = await prisma.event.findMany({
        where: {
          deletedAt: null,
          status: 'published',
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { shortDescription: { contains: q, mode: 'insensitive' } },
          ],
          ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
        },
        take: limit,
        orderBy: { likeCount: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          shortDescription: true,
          bannerUrl: true,
          city: true,
          startDate: true,
          priceMin: true,
        },
      });

      results.events = events.map((event) => ({
        type: 'event' as const,
        id: event.id,
        slug: event.slug,
        name: event.title,
        description: event.shortDescription,
        imageUrl: event.bannerUrl,
        city: event.city,
        extra: {
          startDate: event.startDate,
          priceMin: event.priceMin ? Number(event.priceMin) : null,
        },
      }));
    }

    // Search Venues
    if (type === 'all' || type === 'venues') {
      const venues = await prisma.venue.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
          ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
        },
        take: limit,
        orderBy: { eventCount: 'desc' },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          profilePhotoUrl: true,
          city: true,
          capacity: true,
        },
      });

      results.venues = venues.map((venue) => ({
        type: 'venue' as const,
        id: venue.id,
        slug: venue.slug,
        name: venue.name,
        description: venue.description,
        imageUrl: venue.profilePhotoUrl,
        city: venue.city,
        extra: {
          capacity: venue.capacity,
        },
      }));
    }

    // Search Artists
    if (type === 'all' || type === 'artists') {
      const artists = await prisma.artist.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { bio: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { followerCount: 'desc' },
        select: {
          id: true,
          slug: true,
          name: true,
          bio: true,
          profilePhotoUrl: true,
          genres: true,
          followerCount: true,
        },
      });

      results.artists = artists.map((artist) => ({
        type: 'artist' as const,
        id: artist.id,
        slug: artist.slug,
        name: artist.name,
        description: artist.bio,
        imageUrl: artist.profilePhotoUrl,
        city: null,
        extra: {
          genres: artist.genres,
          followerCount: artist.followerCount,
        },
      }));
    }

    results.total = results.events.length + results.venues.length + results.artists.length;

    return results;
  }
}

export const searchService = new SearchService();
