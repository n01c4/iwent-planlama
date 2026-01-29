/**
 * Database Utilities for E2E Testing
 * Handles setup, teardown, and seeding of test data
 */
import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';

// Create a separate Prisma client for tests
let testPrisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!testPrisma) {
    testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.DEBUG === 'true' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }
  return testPrisma;
}

/**
 * Connect to database
 */
export async function connectDb(): Promise<void> {
  const prisma = getPrisma();
  await prisma.$connect();
  console.log('Test database connected');
}

/**
 * Disconnect from database
 */
export async function disconnectDb(): Promise<void> {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null;
    console.log('Test database disconnected');
  }
}

/**
 * Clean all tables in correct order (respecting foreign keys)
 */
export async function cleanDb(): Promise<void> {
  const prisma = getPrisma();

  // Delete in reverse order of dependencies
  const tablesToClean = [
    // Faz 6 - Analytics
    'event_audience_stats',
    'event_traffic_sources',
    'event_conversion_stats',
    'event_daily_stats',

    // Faz 5 - Social
    'messages',
    'chat_participants',
    'chat_rooms',
    'user_likes',
    'friendships',

    // Faz 4 - Ticketing
    'tickets',
    'order_items',
    'orders',
    'pricing_rules',
    'discount_codes',

    // Faz 2/3 - Core
    'ticket_types',
    'event_photos',
    'event_artists',
    'events',
    'venue_reviews',
    'venues',
    'artist_followers',
    'artists',
    'team_members',
    'organizers',
    'categories',

    // Faz 1 - Auth
    'refresh_tokens',
    'users',
  ];

  for (const table of tablesToClean) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    } catch (error) {
      // Table might not exist, skip
      console.log(`Skipping table ${table}: ${(error as Error).message}`);
    }
  }

  console.log('Test database cleaned');
}

/**
 * Seed minimal required data for tests
 */
export async function seedDb(): Promise<SeedData> {
  const prisma = getPrisma();

  // Create default categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Konserler',
        slug: 'konserler',
        description: 'Canlı müzik etkinlikleri',
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Festivaller',
        slug: 'festivaller',
        description: 'Açık hava festivalleri',
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Spor',
        slug: 'spor',
        description: 'Spor etkinlikleri',
        isActive: true,
        sortOrder: 3,
      },
    }),
  ]);

  // Create admin user
  const adminPasswordHash = await hash('Admin123!', {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@iwent.test',
      passwordHash: adminPasswordHash,
      name: 'Test Admin',
      role: 'admin',
      emailVerified: true,
    },
  });

  console.log('Test database seeded');

  return {
    categories,
    adminUser,
  };
}

/**
 * Create a test user with optional organizer profile
 */
export async function createTestUser(options: CreateUserOptions = {}): Promise<TestUser> {
  const prisma = getPrisma();

  const email = options.email || `test-${Date.now()}@iwent.test`;
  const password = options.password || 'TestPass123!';

  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: options.name || 'Test User',
      role: options.role || 'user',
      emailVerified: options.emailVerified ?? true,
      city: options.city,
    },
  });

  let organizer = null;
  if (options.createOrganizer) {
    organizer = await prisma.organizer.create({
      data: {
        userId: user.id,
        businessName: options.businessName || 'Test Organizer',
        city: options.city || 'Istanbul',
      },
    });

    // Update user role to organizer
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'organizer' },
    });
  }

  return {
    user,
    organizer,
    email,
    password,
  };
}

/**
 * Create a test event
 */
export async function createTestEvent(organizerId: string, options: CreateEventOptions = {}): Promise<any> {
  const prisma = getPrisma();

  const slug = options.slug || `test-event-${Date.now()}`;

  const event = await prisma.event.create({
    data: {
      organizerId,
      title: options.title || 'Test Event',
      slug,
      description: options.description || 'Test event description',
      startDate: options.startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      endDate: options.endDate,
      city: options.city || 'Istanbul',
      status: options.status || 'draft',
      categoryId: options.categoryId,
      venueId: options.venueId,
    },
  });

  // Create ticket types if specified
  if (options.ticketTypes && options.ticketTypes.length > 0) {
    for (const tt of options.ticketTypes) {
      await prisma.ticketType.create({
        data: {
          eventId: event.id,
          name: tt.name,
          price: tt.price,
          capacity: tt.capacity,
          isActive: true,
        },
      });
    }
  }

  return prisma.event.findUnique({
    where: { id: event.id },
    include: { ticketTypes: true },
  });
}

// Types
export interface SeedData {
  categories: any[];
  adminUser: any;
}

export interface CreateUserOptions {
  email?: string;
  password?: string;
  name?: string;
  role?: 'user' | 'organizer' | 'admin';
  emailVerified?: boolean;
  city?: string;
  createOrganizer?: boolean;
  businessName?: string;
}

export interface TestUser {
  user: any;
  organizer: any | null;
  email: string;
  password: string;
}

export interface CreateEventOptions {
  title?: string;
  slug?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  city?: string;
  status?: 'draft' | 'published' | 'cancelled';
  categoryId?: string;
  venueId?: string;
  ticketTypes?: Array<{
    name: string;
    price: number;
    capacity: number;
  }>;
}
