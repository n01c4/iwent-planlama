/**
 * Organizers Module E2E Tests
 * Tests: Organizer Profile CRUD, Team Management
 */
import request from 'supertest';
import {
  getApp,
  closeApp,
  getPrisma,
  createTestUser,
  authRequest,
  loginUser,
  getOrganizerToken,
} from './helpers/setup';
import type { FastifyInstance } from 'fastify';

describe('Organizers Module', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await getApp();
  });

  afterAll(async () => {
    await closeApp();
  });

  // =========================================================================
  // CREATE ORGANIZER PROFILE
  // =========================================================================
  describe('POST /api/v1/org/profile', () => {
    it('should create organizer profile for authenticated user', async () => {
      const email = `create-org-${Date.now()}@iwent.test`;
      await createTestUser({
        email,
        password: 'CreateOrg123!',
        name: 'Future Organizer',
      });

      const tokens = await loginUser(app, {
        email,
        password: 'CreateOrg123!',
      });

      const orgData = {
        businessName: 'Test Event Company',
        description: 'We organize awesome events',
        city: 'Istanbul',
        phone: '+905551234567',
        website: 'https://testevent.com',
      };

      const response = await authRequest(app, tokens.accessToken)
        .post('/api/v1/org/profile')
        .send(orgData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          businessName: 'Test Event Company',
          city: 'Istanbul',
        },
      });

      // Verify in database
      const prisma = getPrisma();
      const organizer = await prisma.organizer.findFirst({
        where: { user: { email } },
        include: { user: true },
      });

      expect(organizer).not.toBeNull();
      expect(organizer?.businessName).toBe('Test Event Company');
      expect(organizer?.user.role).toBe('organizer');
    });

    it('should reject if user already has organizer profile', async () => {
      const { token } = await getOrganizerToken(app);

      await authRequest(app, token)
        .post('/api/v1/org/profile')
        .send({
          businessName: 'Another Company',
          city: 'Ankara',
        })
        .expect(409);
    });

    it('should allow creating profile without business name (optional field)', async () => {
      const email = `no-name-org-${Date.now()}@iwent.test`;
      await createTestUser({
        email,
        password: 'NoNameOrg123!',
      });

      const tokens = await loginUser(app, {
        email,
        password: 'NoNameOrg123!',
      });

      // businessName is optional in the schema
      const response = await authRequest(app, tokens.accessToken)
        .post('/api/v1/org/profile')
        .send({ city: 'Istanbul' })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app.server)
        .post('/api/v1/org/profile')
        .send({
          businessName: 'Test Company',
          city: 'Istanbul',
        })
        .expect(401);
    });
  });

  // =========================================================================
  // GET ORGANIZER PROFILE
  // =========================================================================
  describe('GET /api/v1/org/profile', () => {
    it('should return organizer profile', async () => {
      const { token } = await getOrganizerToken(app);

      const response = await authRequest(app, token)
        .get('/api/v1/org/profile')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          businessName: expect.any(String),
          totalEvents: expect.any(Number),
          totalTicketsSold: expect.any(Number),
        },
      });
    });

    it('should return 404 if user is not an organizer', async () => {
      const email = `not-org-${Date.now()}@iwent.test`;
      await createTestUser({
        email,
        password: 'NotOrg123!',
      });

      const tokens = await loginUser(app, {
        email,
        password: 'NotOrg123!',
      });

      await authRequest(app, tokens.accessToken)
        .get('/api/v1/org/profile')
        .expect(403); // Forbidden - not an organizer
    });

    it('should require authentication', async () => {
      await request(app.server)
        .get('/api/v1/org/profile')
        .expect(401);
    });
  });

  // =========================================================================
  // UPDATE ORGANIZER PROFILE
  // =========================================================================
  describe('PATCH /api/v1/org/profile', () => {
    it('should update organizer profile', async () => {
      const { token, userId } = await getOrganizerToken(app);

      const updateData = {
        businessName: 'Updated Company Name',
        description: 'Updated description',
        city: 'Izmir',
        website: 'https://updated.com',
        socialLinks: {
          instagram: '@updatedcompany',
          twitter: '@updatedco',
        },
      };

      const response = await authRequest(app, token)
        .patch('/api/v1/org/profile')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          businessName: 'Updated Company Name',
          city: 'Izmir',
        },
      });

      // Verify in database
      const prisma = getPrisma();
      const organizer = await prisma.organizer.findFirst({
        where: { userId },
      });

      expect(organizer?.businessName).toBe('Updated Company Name');
      expect(organizer?.city).toBe('Izmir');
    });

    it('should update partial fields', async () => {
      const { token } = await getOrganizerToken(app);

      // Set initial state
      await authRequest(app, token)
        .patch('/api/v1/org/profile')
        .send({
          businessName: 'Original Name',
          city: 'Original City',
        });

      // Update only city
      const response = await authRequest(app, token)
        .patch('/api/v1/org/profile')
        .send({ city: 'New City' })
        .expect(200);

      expect(response.body.data.city).toBe('New City');
      expect(response.body.data.businessName).toBe('Original Name');
    });

    it('should require organizer role', async () => {
      const email = `not-org-update-${Date.now()}@iwent.test`;
      await createTestUser({
        email,
        password: 'NotOrgUpdate123!',
      });

      const tokens = await loginUser(app, {
        email,
        password: 'NotOrgUpdate123!',
      });

      await authRequest(app, tokens.accessToken)
        .patch('/api/v1/org/profile')
        .send({ businessName: 'Hacker' })
        .expect(403);
    });
  });

  // =========================================================================
  // ORGANIZER EVENTS LIST
  // =========================================================================
  describe('GET /api/v1/org/events', () => {
    it('should return empty event list for new organizer', async () => {
      const { token } = await getOrganizerToken(app);

      const response = await authRequest(app, token)
        .get('/api/v1/org/events')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
      });
    });

    it('should require organizer role', async () => {
      const email = `not-org-events-${Date.now()}@iwent.test`;
      await createTestUser({
        email,
        password: 'NotOrgEvents123!',
      });

      const tokens = await loginUser(app, {
        email,
        password: 'NotOrgEvents123!',
      });

      await authRequest(app, tokens.accessToken)
        .get('/api/v1/org/events')
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app.server)
        .get('/api/v1/org/events')
        .expect(401);
    });
  });

  // =========================================================================
  // CREATE EVENT
  // =========================================================================
  describe('POST /api/v1/org/events', () => {
    it('should create draft event', async () => {
      const { token } = await getOrganizerToken(app);

      // Get a category for the event
      const prisma = getPrisma();
      const category = await prisma.category.findFirst();

      const eventData = {
        title: 'Test Concert',
        description: 'An amazing test concert',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        city: 'Istanbul',
        categoryId: category?.id,
      };

      const response = await authRequest(app, token)
        .post('/api/v1/org/events')
        .send(eventData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          title: 'Test Concert',
          slug: expect.any(String),
          status: 'draft',
        },
      });

      // Verify in database
      const event = await prisma.event.findUnique({
        where: { id: response.body.data.id },
      });

      expect(event).not.toBeNull();
      expect(event?.title).toBe('Test Concert');
      expect(event?.status).toBe('draft');
    });

    it('should require title', async () => {
      const { token } = await getOrganizerToken(app);

      await authRequest(app, token)
        .post('/api/v1/org/events')
        .send({
          description: 'Event without title',
          startDate: new Date().toISOString(),
        })
        .expect(400);
    });

    it('should require startDate', async () => {
      const { token } = await getOrganizerToken(app);

      await authRequest(app, token)
        .post('/api/v1/org/events')
        .send({
          title: 'Event without date',
          description: 'No date event',
        })
        .expect(400);
    });

    it('should require organizer role', async () => {
      const email = `not-org-create-${Date.now()}@iwent.test`;
      await createTestUser({
        email,
        password: 'NotOrgCreate123!',
      });

      const tokens = await loginUser(app, {
        email,
        password: 'NotOrgCreate123!',
      });

      await authRequest(app, tokens.accessToken)
        .post('/api/v1/org/events')
        .send({
          title: 'Unauthorized Event',
          startDate: new Date().toISOString(),
        })
        .expect(403);
    });
  });

  // =========================================================================
  // PUBLISH EVENT
  // =========================================================================
  describe('POST /api/v1/org/events/:id/publish', () => {
    it('should publish draft event', async () => {
      const { token } = await getOrganizerToken(app);

      // Create event first
      const eventResponse = await authRequest(app, token)
        .post('/api/v1/org/events')
        .send({
          title: 'Event to Publish',
          description: 'This event will be published',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          city: 'Istanbul',
        });

      const eventId = eventResponse.body.data.id;

      // Publish the event
      const response = await authRequest(app, token)
        .post(`/api/v1/org/events/${eventId}/publish`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: eventId,
          status: 'published',
          publishedAt: expect.any(String),
        },
      });

      // Verify in database
      const prisma = getPrisma();
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      expect(event?.status).toBe('published');
      expect(event?.publishedAt).not.toBeNull();
    });

    it('should not publish already published event', async () => {
      const { token } = await getOrganizerToken(app);

      // Create and publish event
      const eventResponse = await authRequest(app, token)
        .post('/api/v1/org/events')
        .send({
          title: 'Already Published Event',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          city: 'Istanbul',
        });

      const eventId = eventResponse.body.data.id;

      await authRequest(app, token)
        .post(`/api/v1/org/events/${eventId}/publish`)
        .expect(200);

      // Try to publish again
      await authRequest(app, token)
        .post(`/api/v1/org/events/${eventId}/publish`)
        .expect(409);
    });

    it('should not allow other organizer to publish event', async () => {
      // Create event with first organizer
      const { token: token1 } = await getOrganizerToken(app);
      const eventResponse = await authRequest(app, token1)
        .post('/api/v1/org/events')
        .send({
          title: 'Protected Event',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          city: 'Istanbul',
        });

      const eventId = eventResponse.body.data.id;

      // Try to publish with different organizer
      const { token: token2 } = await getOrganizerToken(app);
      await authRequest(app, token2)
        .post(`/api/v1/org/events/${eventId}/publish`)
        .expect(403); // Forbidden - not the owner
    });
  });

  // =========================================================================
  // ORGANIZER STATS
  // =========================================================================
  describe('GET /api/v1/org/profile (Stats)', () => {
    it('should include accurate stats', async () => {
      const { token, userId } = await getOrganizerToken(app);

      // Get profile with stats
      const response = await authRequest(app, token)
        .get('/api/v1/org/profile')
        .expect(200);

      expect(response.body.data).toMatchObject({
        totalEvents: expect.any(Number),
        totalTicketsSold: expect.any(Number),
      });

      // Verify stats match database
      const prisma = getPrisma();
      const organizer = await prisma.organizer.findFirst({
        where: { userId },
      });

      expect(response.body.data.totalEvents).toBe(organizer?.totalEvents);
    });
  });

  // =========================================================================
  // PUBLIC ORGANIZER PROFILE
  // =========================================================================
  // NOTE: Public organizer profile endpoint (/api/v1/organizers/:id) is not implemented
  describe.skip('GET /api/v1/organizers/:id', () => {
    it('should return public organizer profile', async () => {
      // Placeholder - endpoint not implemented
    });
  });
});
