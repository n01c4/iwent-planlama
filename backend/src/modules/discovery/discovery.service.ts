import { prisma } from '../../shared/database/index.js';

/**
 * Event Summary for Discovery
 */
export interface DiscoveryEvent {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  bannerUrl: string | null;
  startDate: Date;
  city: string | null;
  priceMin: number | null;
  priceMax: number | null;
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
 * Category Summary for Discovery
 */
export interface DiscoveryCategory {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  iconUrl: string | null;
  eventCount: number;
}

/**
 * Discovery Feed Response
 */
export interface DiscoveryFeed {
  trending: DiscoveryEvent[];
  thisWeek: DiscoveryEvent[];
  nearYou: DiscoveryEvent[];
  categories: DiscoveryCategory[];
  popularVenues: Array<{
    id: string;
    name: string;
    slug: string;
    city: string | null;
    profilePhotoUrl: string | null;
    eventCount: number;
  }>;
}

class DiscoveryService {
  /**
   * Get discovery feed
   */
  async getDiscoveryFeed(city?: string): Promise<DiscoveryFeed> {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    // Base select for events
    const eventSelect = {
      id: true,
      slug: true,
      title: true,
      shortDescription: true,
      bannerUrl: true,
      startDate: true,
      city: true,
      priceMin: true,
      priceMax: true,
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
    };

    // Execute all queries in parallel
    const [trending, thisWeek, nearYou, categories, popularVenues] = await Promise.all([
      // Trending: Most liked/viewed events
      prisma.event.findMany({
        where: {
          deletedAt: null,
          status: 'published',
          startDate: { gte: now },
        },
        orderBy: [{ likeCount: 'desc' }, { viewCount: 'desc' }],
        take: 10,
        select: eventSelect,
      }),

      // This week: Events starting in the next 7 days
      prisma.event.findMany({
        where: {
          deletedAt: null,
          status: 'published',
          startDate: {
            gte: now,
            lte: weekFromNow,
          },
        },
        orderBy: { startDate: 'asc' },
        take: 10,
        select: eventSelect,
      }),

      // Near you: Events in user's city
      city
        ? prisma.event.findMany({
            where: {
              deletedAt: null,
              status: 'published',
              startDate: { gte: now },
              city: { contains: city, mode: 'insensitive' },
            },
            orderBy: { startDate: 'asc' },
            take: 10,
            select: eventSelect,
          })
        : Promise.resolve([]),

      // Categories with event counts
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
          iconUrl: true,
          _count: {
            select: {
              events: {
                where: {
                  deletedAt: null,
                  status: 'published',
                  startDate: { gte: now },
                },
              },
            },
          },
        },
      }),

      // Popular venues
      prisma.venue.findMany({
        orderBy: { eventCount: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          profilePhotoUrl: true,
          eventCount: true,
        },
      }),
    ]);

    // Transform events to DiscoveryEvent format
    const transformEvent = (event: typeof trending[0]): DiscoveryEvent => ({
      ...event,
      priceMin: event.priceMin ? Number(event.priceMin) : null,
      priceMax: event.priceMax ? Number(event.priceMax) : null,
    });

    return {
      trending: trending.map(transformEvent),
      thisWeek: thisWeek.map(transformEvent),
      nearYou: nearYou.map(transformEvent),
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        color: cat.color,
        iconUrl: cat.iconUrl,
        eventCount: cat._count.events,
      })),
      popularVenues,
    };
  }
}

export const discoveryService = new DiscoveryService();
