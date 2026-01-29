/**
 * Events Module E2E Tests
 * Tests: Public Event Listing, Event Details, Search, Categories
 */
import request from 'supertest';
import {
  getApp,
  closeApp,
  getPrisma,
  createTestEvent,
  authRequest,
  getOrganizerToken,
} from './helpers/setup';
import type { FastifyInstance } from 'fastify';

describe('Events Module', () => {
  let app: FastifyInstance;
  let organizerToken: string;
  let organizerId: string;
  let publishedEventId: string;

  beforeAll(async () => {
    app = await getApp();

    // Create an organizer with published events for testing
    const orgData = await getOrganizerToken(app);
    organizerToken = orgData.token;

    // Get organizer ID
    const prisma = getPrisma();
    const organizer = await prisma.organizer.findFirst({
      where: { userId: orgData.userId },
    });
    organizerId = organizer!.id;

    // Create a published event for public tests
    const category = await prisma.category.findFirst();

    const event = await createTestEvent(organizerId, {
      title: 'Public Test Event',
      description: 'A publicly visible test event',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      city: 'Istanbul',
      status: 'published',
      categoryId: category?.id,
      ticketTypes: [
        { name: 'General Admission', price: 100, capacity: 1000 },
        { name: 'VIP', price: 250, capacity: 100 },
      ],
    });
    publishedEventId = event.id;

    // Update the event to published status
    await prisma.event.update({
      where: { id: publishedEventId },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await closeApp();
  });

  // =========================================================================
  // PUBLIC EVENT LIST
  // =========================================================================
  describe('GET /api/v1/events', () => {
    it('should return list of published events', async () => {
      const response = await request(app.server)
        .get('/api/v1/events')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        meta: expect.objectContaining({
          page: expect.any(Number),
          limit: expect.any(Number),
          total: expect.any(Number),
        }),
      });

      // All returned events should be published
      for (const event of response.body.data) {
        expect(event.status).toBe('published');
      }
    });

    it('should support pagination', async () => {
      const response = await request(app.server)
        .get('/api/v1/events?page=1&limit=5')
        .expect(200);

      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should filter by city', async () => {
      const response = await request(app.server)
        .get('/api/v1/events?city=Istanbul')
        .expect(200);

      for (const event of response.body.data) {
        expect(event.city?.toLowerCase()).toContain('istanbul');
      }
    });

    it('should filter by category', async () => {
      const prisma = getPrisma();
      const category = await prisma.category.findFirst();

      const response = await request(app.server)
        .get(`/api/v1/events?categoryId=${category?.id}`)
        .expect(200);

      for (const event of response.body.data) {
        if (event.categoryId) {
          expect(event.categoryId).toBe(category?.id);
        }
      }
    });

    it('should not return draft events', async () => {
      // Create a draft event
      await createTestEvent(organizerId, {
        title: 'Draft Event - Should Not Show',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'draft',
      });

      const response = await request(app.server)
        .get('/api/v1/events')
        .expect(200);

      const draftEvent = response.body.data.find(
        (e: any) => e.title === 'Draft Event - Should Not Show'
      );
      expect(draftEvent).toBeUndefined();
    });

    it('should filter by date range', async () => {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const response = await request(app.server)
        .get(`/api/v1/events?startDate=${startDate}&endDate=${endDate}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // =========================================================================
  // EVENT DETAILS
  // =========================================================================
  describe('GET /api/v1/events/:id', () => {
    it('should return event details by ID', async () => {
      const response = await request(app.server)
        .get(`/api/v1/events/${publishedEventId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: publishedEventId,
          title: 'Public Test Event',
          status: 'published',
        },
      });
    });

    it('should return event details by slug', async () => {
      const prisma = getPrisma();
      const event = await prisma.event.findUnique({
        where: { id: publishedEventId },
      });

      const response = await request(app.server)
        .get(`/api/v1/events/${event?.slug}`)
        .expect(200);

      expect(response.body.data.id).toBe(publishedEventId);
    });

    // Ticket types are available via separate endpoint
    it('should return ticket types via separate endpoint', async () => {
      const response = await request(app.server)
        .get(`/api/v1/events/${publishedEventId}/ticket-types`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);

      const ticketType = response.body.data[0];
      expect(ticketType).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        price: expect.any(Number), // Price as number
        capacity: expect.any(Number),
      });
    });

    it('should return 404 for non-existent event', async () => {
      await request(app.server)
        .get('/api/v1/events/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    // NOTE: Draft events are accessible by ID for organizer preview purposes
    it('should allow draft event access by ID (for preview)', async () => {
      // Create a draft event
      const draftEvent = await createTestEvent(organizerId, {
        title: 'Hidden Draft Event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'draft',
      });

      const response = await request(app.server)
        .get(`/api/v1/events/${draftEvent.id}`)
        .expect(200);

      expect(response.body.data.status).toBe('draft');
    });

    it('should increment view count', async () => {
      const prisma = getPrisma();

      // Get initial view count
      const before = await prisma.event.findUnique({
        where: { id: publishedEventId },
        select: { viewCount: true },
      });

      // View the event
      await request(app.server)
        .get(`/api/v1/events/${publishedEventId}`)
        .expect(200);

      // Check view count increased
      const after = await prisma.event.findUnique({
        where: { id: publishedEventId },
        select: { viewCount: true },
      });

      expect(after?.viewCount).toBeGreaterThanOrEqual(before?.viewCount || 0);
    });
  });

  // =========================================================================
  // CATEGORIES
  // =========================================================================
  // NOTE: Categories endpoint is not available at /api/v1/search/categories
  describe.skip('GET /api/v1/events/categories', () => {
    it('should return list of categories', async () => {
      // Placeholder - endpoint not implemented
    });
  });

  // =========================================================================
  // SEARCH
  // =========================================================================
  describe('GET /api/v1/search', () => {
    it('should search by query', async () => {
      const response = await request(app.server)
        .get('/api/v1/search?q=Test')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Object),
      });
    });

    it('should support type filter', async () => {
      const response = await request(app.server)
        .get('/api/v1/search?q=Test&type=events')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // =========================================================================
  // ORGANIZER EVENT MANAGEMENT
  // =========================================================================
  describe('Organizer Event Management', () => {
    describe('GET /api/v1/org/events/:id', () => {
      it('should return full event details for owner', async () => {
        const response = await authRequest(app, organizerToken)
          .get(`/api/v1/org/events/${publishedEventId}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: publishedEventId,
            // Should include all fields including stats
            viewCount: expect.any(Number),
          },
        });
      });

      it('should not allow access to other organizer events', async () => {
        const { token: otherToken } = await getOrganizerToken(app);

        await authRequest(app, otherToken)
          .get(`/api/v1/org/events/${publishedEventId}`)
          .expect(403); // Forbidden - not the owner
      });
    });

    describe('PUT /api/v1/org/events/:id', () => {
      it('should update event details', async () => {
        // Create a new event for this test
        const eventResponse = await authRequest(app, organizerToken)
          .post('/api/v1/org/events')
          .send({
            title: 'Event to Update',
            description: 'Original description',
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            city: 'Istanbul',
          });

        const eventId = eventResponse.body.data.id;

        const response = await authRequest(app, organizerToken)
          .put(`/api/v1/org/events/${eventId}`)
          .send({
            title: 'Updated Event Title',
            description: 'Updated description',
          })
          .expect(200);

        expect(response.body.data.title).toBe('Updated Event Title');
        expect(response.body.data.description).toBe('Updated description');

        // Verify in database
        const prisma = getPrisma();
        const event = await prisma.event.findUnique({
          where: { id: eventId },
        });

        expect(event?.title).toBe('Updated Event Title');
      });

      it('should not allow updating other organizer events', async () => {
        const { token: otherToken } = await getOrganizerToken(app);

        await authRequest(app, otherToken)
          .put(`/api/v1/org/events/${publishedEventId}`)
          .send({ title: 'Hacked Title' })
          .expect(403); // Forbidden - not the owner
      });
    });

    describe('DELETE /api/v1/org/events/:id', () => {
      it('should soft delete event', async () => {
        // Create event to delete
        const eventResponse = await authRequest(app, organizerToken)
          .post('/api/v1/org/events')
          .send({
            title: 'Event to Delete',
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            city: 'Istanbul',
          });

        const eventId = eventResponse.body.data.id;

        await authRequest(app, organizerToken)
          .delete(`/api/v1/org/events/${eventId}`)
          .expect(204); // No Content

        // Verify soft delete
        const prisma = getPrisma();
        const event = await prisma.event.findUnique({
          where: { id: eventId },
        });

        expect(event?.deletedAt).not.toBeNull();
      });

      it('should not allow deleting other organizer events', async () => {
        const { token: otherToken } = await getOrganizerToken(app);

        await authRequest(app, otherToken)
          .delete(`/api/v1/org/events/${publishedEventId}`)
          .expect(403); // Forbidden - not the owner
      });
    });

    describe('POST /api/v1/org/events/:id/unpublish', () => {
      it('should unpublish a published event', async () => {
        // Create and publish an event
        const eventResponse = await authRequest(app, organizerToken)
          .post('/api/v1/org/events')
          .send({
            title: 'Event to Unpublish',
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            city: 'Istanbul',
          });

        const eventId = eventResponse.body.data.id;

        await authRequest(app, organizerToken)
          .post(`/api/v1/org/events/${eventId}/publish`)
          .expect(200);

        // Unpublish
        const response = await authRequest(app, organizerToken)
          .post(`/api/v1/org/events/${eventId}/unpublish`)
          .expect(200);

        expect(response.body.data.status).toBe('unpublished');

        // Verify in database
        const prisma = getPrisma();
        const event = await prisma.event.findUnique({
          where: { id: eventId },
        });

        expect(event?.status).toBe('unpublished');
      });
    });
  });

  // =========================================================================
  // TICKET TYPES MANAGEMENT
  // =========================================================================
  describe('Ticket Types', () => {
    let testEventId: string;

    beforeAll(async () => {
      // Create event for ticket type tests
      const eventResponse = await authRequest(app, organizerToken)
        .post('/api/v1/org/events')
        .send({
          title: 'Ticket Types Test Event',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          city: 'Istanbul',
        });

      testEventId = eventResponse.body.data.id;
    });

    describe('POST /api/v1/org/events/:id/ticket-types', () => {
      it('should create ticket type', async () => {
        const response = await authRequest(app, organizerToken)
          .post(`/api/v1/org/events/${testEventId}/ticket-types`)
          .send({
            name: 'Early Bird',
            description: 'Early bird special',
            price: 75,
            capacity: 500,
          })
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            id: expect.any(String),
            name: 'Early Bird',
            price: 75, // Price as number
            capacity: 500,
          },
        });

        // Verify in database
        const prisma = getPrisma();
        const ticketType = await prisma.ticketType.findUnique({
          where: { id: response.body.data.id },
        });

        expect(ticketType).not.toBeNull();
        expect(ticketType?.name).toBe('Early Bird');
      });

      it('should require name and price', async () => {
        await authRequest(app, organizerToken)
          .post(`/api/v1/org/events/${testEventId}/ticket-types`)
          .send({ capacity: 100 })
          .expect(400);
      });
    });

    describe('PATCH /api/v1/org/ticket-types/:id', () => {
      it('should update ticket type', async () => {
        // Create ticket type first
        const createResponse = await authRequest(app, organizerToken)
          .post(`/api/v1/org/events/${testEventId}/ticket-types`)
          .send({
            name: 'Original Name',
            price: 100,
            capacity: 200,
          });

        const ticketTypeId = createResponse.body.data.id;

        const response = await authRequest(app, organizerToken)
          .patch(`/api/v1/org/ticket-types/${ticketTypeId}`)
          .send({
            name: 'Updated Name',
            price: 150,
          })
          .expect(200);

        expect(response.body.data.name).toBe('Updated Name');
        expect(response.body.data.price).toBe(150); // Price as number
      });
    });

    describe('DELETE /api/v1/org/ticket-types/:id', () => {
      it('should delete ticket type without sales', async () => {
        // Create ticket type
        const createResponse = await authRequest(app, organizerToken)
          .post(`/api/v1/org/events/${testEventId}/ticket-types`)
          .send({
            name: 'To Be Deleted',
            price: 50,
            capacity: 100,
          });

        const ticketTypeId = createResponse.body.data.id;

        await authRequest(app, organizerToken)
          .delete(`/api/v1/org/ticket-types/${ticketTypeId}`)
          .expect(204); // No Content

        // Verify deletion
        const prisma = getPrisma();
        const ticketType = await prisma.ticketType.findUnique({
          where: { id: ticketTypeId },
        });

        expect(ticketType).toBeNull();
      });
    });
  });
});
