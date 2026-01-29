/**
 * Test Setup - Handles all test configuration
 */
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../../src/app';
import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment first
const envPath = path.resolve(process.cwd(), '.env.test');
dotenv.config({ path: envPath });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

// Global state
let app: FastifyInstance | null = null;
let prisma: PrismaClient | null = null;
let isDbInitialized = false;
let tokenCache: Map<string, any> = new Map();

// ============================================================================
// DATABASE UTILITIES
// ============================================================================

export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.DEBUG === 'true' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }
  return prisma;
}

async function connectDb(): Promise<void> {
  const p = getPrisma();
  await p.$connect();
  console.log('✓ Test database connected');
}

async function disconnectDb(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    console.log('✓ Test database disconnected');
  }
}

async function cleanDb(): Promise<void> {
  const p = getPrisma();

  // Tables in reverse dependency order
  const tablesToClean = [
    'event_audience_stats', 'event_traffic_sources', 'event_conversion_stats', 'event_daily_stats',
    'messages', 'chat_participants', 'chat_rooms', 'user_likes', 'friendships',
    'tickets', 'order_items', 'orders', 'pricing_rules', 'discount_codes',
    'ticket_types', 'event_photos', 'event_artists', 'events',
    'venue_reviews', 'venues', 'artist_followers', 'artists',
    'team_members', 'organizers', 'categories',
    'refresh_tokens', 'users',
  ];

  for (const table of tablesToClean) {
    try {
      await p.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    } catch {
      // Table might not exist, skip silently
    }
  }

  console.log('✓ Test database cleaned');
}

async function seedDb(): Promise<void> {
  const p = getPrisma();

  // Create default categories
  await Promise.all([
    p.category.create({
      data: { name: 'Konserler', slug: 'konserler', description: 'Canlı müzik etkinlikleri', isActive: true, sortOrder: 1 },
    }),
    p.category.create({
      data: { name: 'Festivaller', slug: 'festivaller', description: 'Açık hava festivalleri', isActive: true, sortOrder: 2 },
    }),
    p.category.create({
      data: { name: 'Spor', slug: 'spor', description: 'Spor etkinlikleri', isActive: true, sortOrder: 3 },
    }),
  ]);

  // Create admin user
  const adminPasswordHash = await hash('Admin123!', {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  await p.user.create({
    data: {
      email: 'admin@iwent.test',
      passwordHash: adminPasswordHash,
      name: 'Test Admin',
      role: 'admin',
      emailVerified: true,
    },
  });

  console.log('✓ Test database seeded');
}

// ============================================================================
// APP UTILITIES
// ============================================================================

export async function getApp(): Promise<FastifyInstance> {
  if (!app) {
    app = await buildApp();
    await app.ready();
  }
  return app;
}

export async function closeApp(): Promise<void> {
  if (app) {
    await app.close();
    app = null;
  }
}

// ============================================================================
// USER UTILITIES
// ============================================================================

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

export async function createTestUser(options: CreateUserOptions = {}): Promise<TestUser> {
  const p = getPrisma();

  const email = options.email || `test-${Date.now()}@iwent.test`;
  const password = options.password || 'TestPass123!';

  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const user = await p.user.create({
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
    organizer = await p.organizer.create({
      data: {
        userId: user.id,
        businessName: options.businessName || 'Test Organizer',
        city: options.city || 'Istanbul',
      },
    });

    await p.user.update({
      where: { id: user.id },
      data: { role: 'organizer' },
    });
  }

  return { user, organizer, email, password };
}

// ============================================================================
// EVENT UTILITIES
// ============================================================================

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
  ticketTypes?: Array<{ name: string; price: number; capacity: number }>;
}

export async function createTestEvent(organizerId: string, options: CreateEventOptions = {}): Promise<any> {
  const p = getPrisma();

  const slug = options.slug || `test-event-${Date.now()}`;

  const event = await p.event.create({
    data: {
      organizerId,
      title: options.title || 'Test Event',
      slug,
      description: options.description || 'Test event description',
      startDate: options.startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: options.endDate,
      city: options.city || 'Istanbul',
      status: options.status || 'draft',
      categoryId: options.categoryId,
      venueId: options.venueId,
    },
  });

  if (options.ticketTypes && options.ticketTypes.length > 0) {
    for (const tt of options.ticketTypes) {
      await p.ticketType.create({
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

  return p.event.findUnique({
    where: { id: event.id },
    include: { ticketTypes: true },
  });
}

// ============================================================================
// AUTH UTILITIES
// ============================================================================

import request from 'supertest';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export async function registerUser(
  appInstance: FastifyInstance,
  credentials: LoginCredentials & { name?: string }
): Promise<AuthTokens> {
  const response = await request(appInstance.server)
    .post('/api/v1/auth/register')
    .send({
      email: credentials.email,
      password: credentials.password,
      name: credentials.name || 'Test User',
    })
    .expect(201);

  const tokens: AuthTokens = {
    accessToken: response.body.data.tokens.accessToken,
    refreshToken: response.body.data.tokens.refreshToken,
    expiresIn: response.body.data.tokens.expiresIn,
  };

  tokenCache.set(credentials.email, tokens);
  return tokens;
}

export async function loginUser(
  appInstance: FastifyInstance,
  credentials: LoginCredentials
): Promise<AuthTokens> {
  const cached = tokenCache.get(credentials.email);
  if (cached) return cached;

  const response = await request(appInstance.server)
    .post('/api/v1/auth/login')
    .send({
      email: credentials.email,
      password: credentials.password,
    })
    .expect(200);

  const tokens: AuthTokens = {
    accessToken: response.body.data.tokens.accessToken,
    refreshToken: response.body.data.tokens.refreshToken,
    expiresIn: response.body.data.tokens.expiresIn,
  };

  tokenCache.set(credentials.email, tokens);
  return tokens;
}

export async function refreshToken(
  appInstance: FastifyInstance,
  refreshTokenValue: string
): Promise<AuthTokens> {
  const response = await request(appInstance.server)
    .post('/api/v1/auth/refresh')
    .send({ refreshToken: refreshTokenValue })
    .expect(200);

  return {
    accessToken: response.body.data.tokens.accessToken,
    refreshToken: response.body.data.tokens.refreshToken,
    expiresIn: response.body.data.tokens.expiresIn,
  };
}

export async function logoutUser(
  appInstance: FastifyInstance,
  refreshTokenValue: string
): Promise<void> {
  await request(appInstance.server)
    .post('/api/v1/auth/logout')
    .send({ refreshToken: refreshTokenValue })
    .expect(200);
}

export async function getAccessToken(
  appInstance: FastifyInstance,
  credentials: LoginCredentials
): Promise<string> {
  try {
    const tokens = await loginUser(appInstance, credentials);
    return tokens.accessToken;
  } catch {
    const tokens = await registerUser(appInstance, credentials);
    return tokens.accessToken;
  }
}

export function authRequest(appInstance: FastifyInstance, token: string) {
  return {
    get: (url: string) =>
      request(appInstance.server)
        .get(url)
        .set('Authorization', `Bearer ${token}`),
    post: (url: string) =>
      request(appInstance.server)
        .post(url)
        .set('Authorization', `Bearer ${token}`),
    put: (url: string) =>
      request(appInstance.server)
        .put(url)
        .set('Authorization', `Bearer ${token}`),
    patch: (url: string) =>
      request(appInstance.server)
        .patch(url)
        .set('Authorization', `Bearer ${token}`),
    delete: (url: string) =>
      request(appInstance.server)
        .delete(url)
        .set('Authorization', `Bearer ${token}`),
  };
}

export function clearTokenCache(): void {
  tokenCache.clear();
}

export async function getAdminToken(appInstance: FastifyInstance): Promise<string> {
  return getAccessToken(appInstance, { email: 'admin@iwent.test', password: 'Admin123!' });
}

export async function getOrganizerToken(
  appInstance: FastifyInstance,
  email?: string
): Promise<{ token: string; userId: string }> {
  const credentials = {
    email: email || `organizer-${Date.now()}@iwent.test`,
    password: 'OrgPass123!',
    name: 'Test Organizer',
  };

  const response = await request(appInstance.server)
    .post('/api/v1/auth/register')
    .send(credentials);

  if (response.status !== 201) {
    const loginResponse = await request(appInstance.server)
      .post('/api/v1/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);

    return {
      token: loginResponse.body.data.tokens.accessToken,
      userId: loginResponse.body.data.user.id,
    };
  }

  const token = response.body.data.tokens.accessToken;
  const userId = response.body.data.user.id;

  await request(appInstance.server)
    .post('/api/v1/org/profile')
    .set('Authorization', `Bearer ${token}`)
    .send({ businessName: 'Test Organization', city: 'Istanbul' });

  const loginResponse = await request(appInstance.server)
    .post('/api/v1/auth/login')
    .send({ email: credentials.email, password: credentials.password })
    .expect(200);

  return {
    token: loginResponse.body.data.tokens.accessToken,
    userId: loginResponse.body.data.user.id,
  };
}

// ============================================================================
// JEST LIFECYCLE
// ============================================================================

// Initialize database once before all tests
beforeAll(async () => {
  if (!isDbInitialized) {
    console.log('\n========================================');
    console.log('  iWent E2E Test Suite - Setup');
    console.log('========================================\n');

    // Validate environment
    const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }

    // Safety check
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.includes('prod') || dbUrl.includes('production')) {
      throw new Error('SAFETY: Refusing to run E2E tests on production database!');
    }

    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Database:', dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

    await connectDb();
    await cleanDb();
    await seedDb();

    isDbInitialized = true;
    console.log('\n✓ Global setup complete\n');
  }

  clearTokenCache();
}, 60000);

// Cleanup after all tests
afterAll(async () => {
  await closeApp();
  await disconnectDb();
  console.log('\n✓ Test cleanup complete\n');
}, 30000);

// Export for backward compatibility
export { app };
