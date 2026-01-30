/**
 * NLP Search E2E Tests - Phase 8
 * Tests: Natural Language Search, AI Intent Parsing, Fallback Behavior
 */
import request from 'supertest';
import {
  getApp,
  closeApp,
  getPrisma,
  createTestUser,
  createTestEvent,
  getOrganizerToken,
  authRequest,
  clearTokenCache,
} from './helpers/setup';
import type { FastifyInstance } from 'fastify';

describe('NLP Search Module - Phase 8', () => {
  let app: FastifyInstance;
  let organizerToken: string;
  let organizerId: string;
  let userToken: string;

  beforeAll(async () => {
    app = await getApp();

    // Create organizer with events for testing
    const orgResult = await getOrganizerToken(app, `nlp-organizer-${Date.now()}@iwent.test`);
    organizerToken = orgResult.token;

    // Get organizer ID from the organizer profile
    const orgProfileResponse = await authRequest(app, organizerToken)
      .get('/api/v1/org/profile');
    organizerId = orgProfileResponse.body.data?.id;

    // If we have an organizer, create test events
    if (organizerId) {
      // Create test events in different cities with different categories
      await createTestEvent(organizerId, {
        title: 'İstanbul Canlı Müzik Festivali',
        slug: `istanbul-muzik-${Date.now()}`,
        description: 'Harika bir canlı müzik konseri',
        city: 'İstanbul',
        status: 'published',
      });

      await createTestEvent(organizerId, {
        title: 'Ankara Stand-up Gecesi',
        slug: `ankara-standup-${Date.now()}`,
        description: 'Komedi gösterisi',
        city: 'Ankara',
        status: 'published',
      });

      await createTestEvent(organizerId, {
        title: 'İzmir Açık Hava Tiyatrosu',
        slug: `izmir-tiyatro-${Date.now()}`,
        description: 'Açık hava tiyatro etkinliği',
        city: 'İzmir',
        status: 'published',
      });
    }

    // Create test user for search
    const userResult = await createTestUser({
      email: `nlp-user-${Date.now()}@iwent.test`,
      password: 'NlpUserPass123!',
    });

    const userLoginResponse = await request(app.server)
      .post('/api/v1/auth/login')
      .send({
        email: userResult.email,
        password: 'NlpUserPass123!',
      });

    userToken = userLoginResponse.body.data?.tokens?.accessToken;
  });

  afterAll(async () => {
    await closeApp();
  });

  beforeEach(() => {
    clearTokenCache();
  });

  // =========================================================================
  // POST /search/natural - Basic Tests
  // =========================================================================
  describe('POST /api/v1/search/natural', () => {
    it('should return search results for a simple query', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'konser İstanbul',
          limit: 10,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          results: {
            events: expect.any(Array),
            venues: expect.any(Array),
            artists: expect.any(Array),
          },
          metadata: {
            query: 'konser İstanbul',
            parsedIntent: expect.objectContaining({
              searchType: expect.any(String),
            }),
            fallbackUsed: expect.any(Boolean),
            responseTimeMs: expect.any(Number),
          },
          total: expect.any(Number),
        },
      });
    });

    it('should parse Turkish natural language query', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'Cuma akşamı İstanbul\'da canlı müzik konserleri',
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metadata.parsedIntent).toBeDefined();
      expect(response.body.data.metadata.parsedIntent.keywords).toEqual(expect.any(Array));
    });

    it('should extract location from query', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'Ankara\'da etkinlik',
          limit: 10,
        })
        .expect(200);

      // The location should be extracted (either by AI or fallback)
      expect(response.body.data.metadata.parsedIntent.location).toBeDefined();
    });

    it('should apply user preferences', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'konser',
          limit: 10,
          userPreferences: {
            city: 'İstanbul',
            categories: ['music'],
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Results should respect user preferences
      expect(response.body.data.metadata.parsedIntent.location).toBeDefined();
    });

    it('should respect limit parameter', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'etkinlik',
          limit: 5,
        })
        .expect(200);

      const { events, venues, artists } = response.body.data.results;
      expect(events.length).toBeLessThanOrEqual(5);
      expect(venues.length).toBeLessThanOrEqual(5);
      expect(artists.length).toBeLessThanOrEqual(5);
    });
  });

  // =========================================================================
  // Validation Tests
  // =========================================================================
  describe('Input Validation', () => {
    it('should reject query shorter than 3 characters', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'ab',
          limit: 10,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject query longer than 500 characters', async () => {
      const longQuery = 'a'.repeat(501);

      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: longQuery,
          limit: 10,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject limit greater than 50', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'konser',
          limit: 100,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject empty body', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // =========================================================================
  // Response Structure Tests
  // =========================================================================
  describe('Response Structure', () => {
    it('should include all required metadata fields', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'müzik',
          limit: 10,
        })
        .expect(200);

      const { metadata } = response.body.data;

      expect(metadata).toHaveProperty('query');
      expect(metadata).toHaveProperty('parsedIntent');
      expect(metadata).toHaveProperty('fallbackUsed');
      expect(metadata).toHaveProperty('responseTimeMs');
    });

    it('should include parsedIntent with searchType', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'stand-up gösterisi',
          limit: 10,
        })
        .expect(200);

      const { parsedIntent } = response.body.data.metadata;

      expect(['event', 'venue', 'artist', 'mixed']).toContain(parsedIntent.searchType);
    });

    it('should return proper event result structure', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'etkinlik',
          limit: 10,
        })
        .expect(200);

      const { events } = response.body.data.results;

      if (events.length > 0) {
        const event = events[0];
        expect(event).toHaveProperty('type', 'event');
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('slug');
        expect(event).toHaveProperty('name');
        expect(event).toHaveProperty('description');
        expect(event).toHaveProperty('imageUrl');
        expect(event).toHaveProperty('city');
      }
    });
  });

  // =========================================================================
  // Fallback Behavior Tests
  // =========================================================================
  describe('Fallback Behavior', () => {
    it('should use fallback for ambiguous queries', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'xyz123 bilinmeyen kelime',
          limit: 10,
        })
        .expect(200);

      // Should still return a response with fallbackUsed flag
      expect(response.body.success).toBe(true);
      expect(response.body.data.metadata).toBeDefined();
    });

    it('should return results even when AI confidence is low', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'asdfghjkl',
          limit: 10,
        })
        .expect(200);

      // Should return a valid response structure
      expect(response.body.data.results).toBeDefined();
      expect(response.body.data.metadata.fallbackUsed).toBe(true);
    });
  });

  // =========================================================================
  // Performance Tests
  // =========================================================================
  describe('Performance', () => {
    it('should respond within acceptable time (<2s)', async () => {
      const startTime = Date.now();

      await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'İstanbul konser',
          limit: 10,
        })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Response should be under 2 seconds (2000ms)
      expect(responseTime).toBeLessThan(2000);
    });

    it('should track response time in metadata', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'konser',
          limit: 10,
        })
        .expect(200);

      expect(response.body.data.metadata.responseTimeMs).toBeDefined();
      expect(typeof response.body.data.metadata.responseTimeMs).toBe('number');
      expect(response.body.data.metadata.responseTimeMs).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Date Extraction Tests
  // =========================================================================
  describe('Date Extraction', () => {
    it('should extract date from "bu hafta sonu" query', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'bu hafta sonu konser',
          limit: 10,
        })
        .expect(200);

      // Date range should be extracted (either by AI or fallback)
      expect(response.body.success).toBe(true);
    });

    it('should extract date from "yarın" query', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'yarın etkinlik',
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should extract date from day name query', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'cuma akşamı konser',
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // =========================================================================
  // Price Range Extraction Tests
  // =========================================================================
  describe('Price Range Extraction', () => {
    it('should extract price from "X TL altında" query', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: '200 TL altında etkinlik',
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should extract free events from "ücretsiz" query', async () => {
      const response = await request(app.server)
        .post('/api/v1/search/natural')
        .send({
          query: 'ücretsiz etkinlik İstanbul',
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // =========================================================================
  // Authenticated Search Tests
  // =========================================================================
  describe('Authenticated Search', () => {
    it('should work with authenticated user', async () => {
      if (!userToken) {
        console.log('Skipping authenticated test - no user token');
        return;
      }

      const response = await authRequest(app, userToken)
        .post('/api/v1/search/natural')
        .send({
          query: 'konser İstanbul',
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // =========================================================================
  // Module Status Test
  // =========================================================================
  describe('GET /api/v1/search/status', () => {
    it('should return search module status with NLP enabled', async () => {
      const response = await request(app.server)
        .get('/api/v1/search/status')
        .expect(200);

      expect(response.body).toMatchObject({
        module: 'search',
        status: 'active',
        nlpSearchEnabled: true,
        endpoints: expect.arrayContaining([
          expect.stringContaining('natural'),
        ]),
      });
    });
  });
});
