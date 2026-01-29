/**
 * Users Module E2E Tests
 * Tests: Profile CRUD, User Settings
 */
import request from 'supertest';
import {
  getApp,
  closeApp,
  getPrisma,
  createTestUser,
  authRequest,
  registerUser,
  loginUser,
} from './helpers/setup';
import type { FastifyInstance } from 'fastify';

describe('Users Module', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await getApp();
  });

  afterAll(async () => {
    await closeApp();
  });

  // =========================================================================
  // GET CURRENT USER (ME)
  // =========================================================================
  describe('GET /api/v1/users/me', () => {
    let userToken: string;
    const testEmail = 'me-test@iwent.test';

    beforeAll(async () => {
      // Create user and login
      await createTestUser({
        email: testEmail,
        password: 'MeTest123!',
        name: 'Me Test User',
        city: 'Istanbul',
      });

      const tokens = await loginUser(app, {
        email: testEmail,
        password: 'MeTest123!',
      });
      userToken = tokens.accessToken;
    });

    it('should return current user profile', async () => {
      const response = await authRequest(app, userToken)
        .get('/api/v1/users/me')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          email: testEmail,
          name: 'Me Test User',
          role: 'user',
          emailVerified: true,
        },
      });

      // Should not expose password hash
      expect(response.body.data.passwordHash).toBeUndefined();
      expect(response.body.data.password).toBeUndefined();
    });

    it('should require authentication', async () => {
      await request(app.server)
        .get('/api/v1/users/me')
        .expect(401);
    });
  });

  // =========================================================================
  // UPDATE PROFILE
  // =========================================================================
  describe('PATCH /api/v1/users/me', () => {
    let userToken: string;
    let userId: string;
    const testEmail = 'update-profile@iwent.test';

    beforeAll(async () => {
      const testUser = await createTestUser({
        email: testEmail,
        password: 'UpdateProfile123!',
        name: 'Original Name',
      });
      userId = testUser.user.id;

      const tokens = await loginUser(app, {
        email: testEmail,
        password: 'UpdateProfile123!',
      });
      userToken = tokens.accessToken;
    });

    it('should update user profile', async () => {
      const updateData = {
        name: 'Updated Name',
        city: 'Ankara',
        bio: 'This is my bio',
      };

      const response = await authRequest(app, userToken)
        .patch('/api/v1/users/me')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          name: 'Updated Name',
          city: 'Ankara',
          bio: 'This is my bio',
        },
      });

      // Verify in database
      const prisma = getPrisma();
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      expect(dbUser?.name).toBe('Updated Name');
      expect(dbUser?.city).toBe('Ankara');
      expect(dbUser?.bio).toBe('This is my bio');
    });

    it('should update only provided fields', async () => {
      // First, set initial values
      await authRequest(app, userToken)
        .patch('/api/v1/users/me')
        .send({ name: 'Name Before', city: 'City Before' });

      // Then update only name
      const response = await authRequest(app, userToken)
        .patch('/api/v1/users/me')
        .send({ name: 'Only Name Changed' })
        .expect(200);

      expect(response.body.data.name).toBe('Only Name Changed');
      expect(response.body.data.city).toBe('City Before'); // Should remain unchanged
    });

    it('should not allow updating email directly', async () => {
      const response = await authRequest(app, userToken)
        .patch('/api/v1/users/me')
        .send({ email: 'newemail@iwent.test' })
        .expect(200); // Should succeed but ignore email

      // Email should remain unchanged
      const meResponse = await authRequest(app, userToken)
        .get('/api/v1/users/me');

      expect(meResponse.body.data.email).toBe(testEmail);
    });

    it('should not allow updating role', async () => {
      const response = await authRequest(app, userToken)
        .patch('/api/v1/users/me')
        .send({ role: 'admin' })
        .expect(200);

      // Role should remain unchanged
      const meResponse = await authRequest(app, userToken)
        .get('/api/v1/users/me');

      expect(meResponse.body.data.role).toBe('user');
    });

    it('should require authentication', async () => {
      await request(app.server)
        .patch('/api/v1/users/me')
        .send({ name: 'New Name' })
        .expect(401);
    });
  });

  // =========================================================================
  // CHANGE PASSWORD
  // =========================================================================
  // NOTE: POST /api/v1/users/me/password endpoint is not yet implemented
  describe.skip('POST /api/v1/users/me/password', () => {
    it('should change password with correct current password', async () => {
      // Placeholder - endpoint not implemented
    });
  });

  // =========================================================================
  // GET USER BY ID (PUBLIC PROFILE)
  // =========================================================================
  describe('GET /api/v1/users/:id', () => {
    let testUserId: string;

    beforeAll(async () => {
      const testUser = await createTestUser({
        email: `public-profile-${Date.now()}@iwent.test`,
        password: 'PublicProfile123!',
        name: 'Public User',
        city: 'Istanbul',
      });
      testUserId = testUser.user.id;
    });

    it('should return public user profile', async () => {
      const response = await request(app.server)
        .get(`/api/v1/users/${testUserId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: testUserId,
          name: 'Public User',
        },
      });

      // Should not expose sensitive data
      expect(response.body.data.email).toBeUndefined();
      expect(response.body.data.passwordHash).toBeUndefined();
      expect(response.body.data.phone).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.server)
        .get(`/api/v1/users/${fakeId}`)
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.server)
        .get('/api/v1/users/invalid-uuid')
        .expect(400);
    });
  });

  // =========================================================================
  // USER TICKETS
  // =========================================================================
  describe('GET /api/v1/users/me/tickets', () => {
    let userToken: string;

    beforeAll(async () => {
      const email = `tickets-user-${Date.now()}@iwent.test`;
      await createTestUser({
        email,
        password: 'TicketsUser123!',
      });

      const tokens = await loginUser(app, {
        email,
        password: 'TicketsUser123!',
      });
      userToken = tokens.accessToken;
    });

    it('should return empty ticket list for new user', async () => {
      const response = await authRequest(app, userToken)
        .get('/api/v1/users/me/tickets')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [],
      });
    });

    it('should require authentication', async () => {
      await request(app.server)
        .get('/api/v1/users/me/tickets')
        .expect(401);
    });
  });

  // =========================================================================
  // USER ORDERS
  // =========================================================================
  describe('GET /api/v1/users/me/orders', () => {
    let userToken: string;

    beforeAll(async () => {
      const email = `orders-user-${Date.now()}@iwent.test`;
      await createTestUser({
        email,
        password: 'OrdersUser123!',
      });

      const tokens = await loginUser(app, {
        email,
        password: 'OrdersUser123!',
      });
      userToken = tokens.accessToken;
    });

    it('should return empty order list for new user', async () => {
      const response = await authRequest(app, userToken)
        .get('/api/v1/users/me/orders')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [],
      });
    });

    it('should require authentication', async () => {
      await request(app.server)
        .get('/api/v1/users/me/orders')
        .expect(401);
    });
  });

  // =========================================================================
  // DELETE ACCOUNT
  // =========================================================================
  // NOTE: DELETE /api/v1/users/me endpoint is not yet implemented
  describe.skip('DELETE /api/v1/users/me', () => {
    it('should soft delete user account', async () => {
      // Placeholder - endpoint not implemented
    });
  });
});
