import { prisma } from '../../shared/database/index.js';
import { nlpCache } from '../../shared/cache/index.js';
import { aiService, type SearchIntent } from '../ai/index.js';
import type { SearchQueryInput, NaturalSearchInput } from './search.schema.js';
import type { Prisma } from '@prisma/client';

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

/**
 * Natural Search Response with metadata
 */
export interface NaturalSearchResults {
  results: {
    events: SearchResultItem[];
    venues: SearchResultItem[];
    artists: SearchResultItem[];
  };
  metadata: {
    query: string;
    parsedIntent: {
      searchType: 'event' | 'venue' | 'artist' | 'mixed';
      dateRange?: { start?: string; end?: string };
      location?: string;
      categories?: string[];
      keywords?: string[];
    };
    fallbackUsed: boolean;
    responseTimeMs: number;
  };
  total: number;
}

class SearchService {
  /**
   * Search across events, venues, and artists (keyword-based)
   */
  async search(query: SearchQueryInput): Promise<SearchResults> {
    const { q, type, limit, city } = query;

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

  /**
   * NLP-powered natural language search
   * Uses AI to understand query intent and returns semantically relevant results
   */
  async naturalSearch(input: NaturalSearchInput): Promise<NaturalSearchResults> {
    const startTime = Date.now();
    const { query, limit = 10, userPreferences } = input;

    // Build cache key filters
    const cacheFilters = {
      limit,
      ...userPreferences,
    };

    // Check results cache first
    const cachedResults = nlpCache.getResults<NaturalSearchResults>(query, cacheFilters);
    if (cachedResults) {
      // Update response time for cached results
      return {
        ...cachedResults,
        metadata: {
          ...cachedResults.metadata,
          responseTimeMs: Date.now() - startTime,
        },
      };
    }

    // Try to parse query with AI
    let intent = await aiService.parseSearchQuery(query);
    let fallbackUsed = false;

    // Determine if we should use fallback
    if (!intent || intent.confidence < 0.6) {
      fallbackUsed = true;
      // If AI completely failed, create a basic intent
      if (!intent) {
        intent = {
          searchType: 'mixed',
          keywords: query.split(/\s+/).filter((w) => w.length > 2),
          confidence: 0.3,
        };
      }
    }

    // Apply user preferences to intent
    if (userPreferences) {
      if (userPreferences.city && !intent.location) {
        intent.location = userPreferences.city;
      }
      if (userPreferences.categories && userPreferences.categories.length > 0 && !intent.categories) {
        intent.categories = userPreferences.categories;
      }
      if (userPreferences.priceRange && !intent.priceRange) {
        intent.priceRange = userPreferences.priceRange;
      }
    }

    // Execute search based on intent
    const results = await this.executeIntentSearch(intent, limit, fallbackUsed);

    // Build response
    const responseTimeMs = Date.now() - startTime;

    const response: NaturalSearchResults = {
      results: {
        events: results.events,
        venues: results.venues,
        artists: results.artists,
      },
      metadata: {
        query,
        parsedIntent: {
          searchType: intent.searchType,
          dateRange: intent.dateRange
            ? {
                start: intent.dateRange.start?.toISOString(),
                end: intent.dateRange.end?.toISOString(),
              }
            : undefined,
          location: intent.location,
          categories: intent.categories,
          keywords: intent.keywords,
        },
        fallbackUsed,
        responseTimeMs,
      },
      total: results.total,
    };

    // Cache the results
    nlpCache.setResults(query, response, cacheFilters);

    return response;
  }

  /**
   * Execute search based on parsed intent
   */
  private async executeIntentSearch(
    intent: SearchIntent,
    limit: number,
    fallbackUsed: boolean
  ): Promise<SearchResults> {
    const results: SearchResults = {
      events: [],
      venues: [],
      artists: [],
      total: 0,
    };

    const shouldSearchEvents = intent.searchType === 'event' || intent.searchType === 'mixed';
    const shouldSearchVenues = intent.searchType === 'venue' || intent.searchType === 'mixed';
    const shouldSearchArtists = intent.searchType === 'artist' || intent.searchType === 'mixed';

    // Search Events
    if (shouldSearchEvents) {
      const eventWhere = this.buildEventWhereFromIntent(intent);
      const events = await prisma.event.findMany({
        where: eventWhere,
        take: limit,
        orderBy: [
          { likeCount: 'desc' },
          { viewCount: 'desc' },
          { startDate: 'asc' },
        ],
        select: {
          id: true,
          slug: true,
          title: true,
          shortDescription: true,
          bannerUrl: true,
          city: true,
          startDate: true,
          priceMin: true,
          likeCount: true,
          category: {
            select: {
              slug: true,
              name: true,
            },
          },
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
          likeCount: event.likeCount,
          category: event.category?.name || null,
        },
      }));
    }

    // Search Venues
    if (shouldSearchVenues) {
      const venueWhere = this.buildVenueWhereFromIntent(intent);
      const venues = await prisma.venue.findMany({
        where: venueWhere,
        take: limit,
        orderBy: [
          { eventCount: 'desc' },
          { averageRating: 'desc' },
        ],
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          profilePhotoUrl: true,
          city: true,
          capacity: true,
          averageRating: true,
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
          averageRating: venue.averageRating ? Number(venue.averageRating) : null,
        },
      }));
    }

    // Search Artists
    if (shouldSearchArtists) {
      const artistWhere = this.buildArtistWhereFromIntent(intent);
      const artists = await prisma.artist.findMany({
        where: artistWhere,
        take: limit,
        orderBy: [
          { followerCount: 'desc' },
          { eventCount: 'desc' },
        ],
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

    // If no results and AI was used, try keyword fallback
    if (results.total === 0 && !fallbackUsed && intent.keywords.length > 0) {
      const keywordQuery = intent.keywords.join(' ');
      const fallbackResults = await this.search({
        q: keywordQuery,
        type: 'all',
        limit,
        city: intent.location,
      });
      return fallbackResults;
    }

    return results;
  }

  /**
   * Build Prisma WHERE clause for events from intent
   */
  private buildEventWhereFromIntent(intent: SearchIntent): Prisma.EventWhereInput {
    const where: Prisma.EventWhereInput = {
      deletedAt: null,
      status: 'published',
    };

    // Keyword search
    if (intent.keywords.length > 0) {
      where.OR = intent.keywords.flatMap((keyword) => [
        { title: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { shortDescription: { contains: keyword, mode: 'insensitive' } },
      ]);
    }

    // Location filter
    if (intent.location) {
      where.city = { contains: intent.location, mode: 'insensitive' };
    }

    // Date range filter
    if (intent.dateRange) {
      if (intent.dateRange.start) {
        where.startDate = { gte: intent.dateRange.start };
      }
      if (intent.dateRange.end) {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : []),
          { startDate: { lte: intent.dateRange.end } },
        ];
      }
    }

    // Category filter
    if (intent.categories && intent.categories.length > 0) {
      where.category = {
        slug: { in: intent.categories },
      };
    }

    // Price range filter
    if (intent.priceRange) {
      if (intent.priceRange.min !== undefined) {
        where.priceMin = { gte: intent.priceRange.min };
      }
      if (intent.priceRange.max !== undefined) {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : []),
          {
            OR: [
              { priceMin: { lte: intent.priceRange.max } },
              { priceMin: null },
            ],
          },
        ];
      }
    }

    return where;
  }

  /**
   * Build Prisma WHERE clause for venues from intent
   */
  private buildVenueWhereFromIntent(intent: SearchIntent): Prisma.VenueWhereInput {
    const where: Prisma.VenueWhereInput = {};

    // Keyword search
    if (intent.keywords.length > 0) {
      where.OR = intent.keywords.flatMap((keyword) => [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ]);
    }

    // Location filter
    if (intent.location) {
      where.city = { contains: intent.location, mode: 'insensitive' };
    }

    return where;
  }

  /**
   * Build Prisma WHERE clause for artists from intent
   */
  private buildArtistWhereFromIntent(intent: SearchIntent): Prisma.ArtistWhereInput {
    const where: Prisma.ArtistWhereInput = {};

    // Keyword search
    if (intent.keywords.length > 0) {
      where.OR = intent.keywords.flatMap((keyword) => [
        { name: { contains: keyword, mode: 'insensitive' } },
        { bio: { contains: keyword, mode: 'insensitive' } },
      ]);
    }

    // Genre filter (categories can map to genres for artists)
    if (intent.categories && intent.categories.length > 0) {
      // This is a JSON array, so we use raw query or path operation
      // For now, we'll filter in memory after fetch or use contains
      // Prisma JSON filtering is limited, so we'll keep it simple
    }

    return where;
  }
}

export const searchService = new SearchService();
