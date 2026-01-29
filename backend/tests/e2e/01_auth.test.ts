/**
 * Auth Module E2E Tests
 * Tests: Register, Login, Refresh Token, Logout
 */
import request from 'supertest';
import {
  getApp,
  closeApp,
  getPrisma,
  createTestUser,
  authRequest,
  clearTokenCache,
} from './helpers/setup';
import type { FastifyInstance } from 'fastify';

describe('Auth Module', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await getApp();
  });

  afterAll(async () => {
    await closeApp();
  });

  beforeEach(() => {
    clearTokenCache();
  });

  // =========================================================================
  // REGISTER TESTS
  // =========================================================================
  describe('POST /api/v1/auth/register', () => {
    const validUser = {
      email: `register-test-${Date.now()}@iwent.test`,
      password: 'SecurePass123!',
      name: 'Register Test User',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(201);

      // Check response structure
      expect(response.body).toMatchObject({
        success: true,
        data: {
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            expiresIn: expect.any(Number),
          },
          user: {
            id: expect.any(String),
            email: validUser.email,
            name: validUser.name,
            role: 'user',
          },
        },
      });

      // Verify user was created in database
      const prisma = getPrisma();
      const dbUser = await prisma.user.findUnique({
        where: { email: validUser.email },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser?.email).toBe(validUser.email);
      expect(dbUser?.name).toBe(validUser.name);
      expect(dbUser?.passwordHash).not.toBe(validUser.password); // Should be hashed
    });

    it('should reject registration with duplicate email', async () => {
      // First registration
      await request(app.server)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@iwent.test',
          password: 'Password123!',
          name: 'User 1',
        })
        .expect(201);

      // Duplicate registration
      const response = await request(app.server)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@iwent.test',
          password: 'Password123!',
          name: 'User 2',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/register')
        .send({
          email: 'weakpass@iwent.test',
          password: '123', // Too short
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration without required fields', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // =========================================================================
  // LOGIN TESTS
  // =========================================================================
  describe('POST /api/v1/auth/login', () => {
    const testEmail = 'login-test@iwent.test';
    const testPassword = 'LoginPass123!';

    beforeAll(async () => {
      // Create test user for login tests
      await createTestUser({
        email: testEmail,
        password: testPassword,
        name: 'Login Test User',
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            expiresIn: expect.any(Number),
          },
          user: {
            id: expect.any(String),
            email: testEmail,
          },
        },
      });

      // Verify refresh token was stored in database
      const prisma = getPrisma();
      const tokens = await prisma.refreshToken.findMany({
        where: { user: { email: testEmail } },
      });

      expect(tokens.length).toBeGreaterThan(0);
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@iwent.test',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should update lastLoginAt on successful login', async () => {
      const prisma = getPrisma();

      // Get user before login
      const beforeLogin = await prisma.user.findUnique({
        where: { email: testEmail },
      });

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      // Check lastLoginAt was updated
      const afterLogin = await prisma.user.findUnique({
        where: { email: testEmail },
      });

      expect(afterLogin?.lastLoginAt).not.toBeNull();
      if (beforeLogin?.lastLoginAt) {
        expect(afterLogin?.lastLoginAt?.getTime()).toBeGreaterThan(
          beforeLogin.lastLoginAt.getTime()
        );
      }
    });
  });

  // =========================================================================
  // REFRESH TOKEN TESTS
  // =========================================================================
  describe('POST /api/v1/auth/refresh', () => {
    let validRefreshToken: string;
    const testEmail = 'refresh-test@iwent.test';

    beforeAll(async () => {
      // Create user and login to get refresh token
      await createTestUser({
        email: testEmail,
        password: 'RefreshPass123!',
      });

      const loginResponse = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'RefreshPass123!',
        });

      validRefreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            expiresIn: expect.any(Number),
          },
        },
      });

      // New refresh token should be different (rotation)
      expect(response.body.data.tokens.refreshToken).not.toBe(validRefreshToken);

      // Update for subsequent tests
      validRefreshToken = response.body.data.tokens.refreshToken;
    });

    it('should reject expired/invalid refresh token', async () => {
      const response = await request(app.server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token-12345' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject reused (revoked) refresh token', async () => {
      // Login to get a fresh token
      const loginResponse = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'RefreshPass123!',
        });

      const token = loginResponse.body.data.tokens.refreshToken;

      // Use the token once
      await request(app.server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: token })
        .expect(200);

      // Try to use the same token again (should be revoked)
      const response = await request(app.server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: token })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // =========================================================================
  // LOGOUT TESTS
  // =========================================================================
  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully with valid refresh token', async () => {
      // Create user and login
      const email = `logout-test-${Date.now()}@iwent.test`;
      await createTestUser({
        email,
        password: 'LogoutPass123!',
      });

      const loginResponse = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email,
          password: 'LogoutPass123!',
        });

      const refreshToken = loginResponse.body.data.tokens.refreshToken;

      // Logout
      const response = await request(app.server)
        .post('/api/v1/auth/logout')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify token is revoked - refresh should fail
      await request(app.server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  // =========================================================================
  // LOGOUT ALL TESTS
  // =========================================================================
  describe('POST /api/v1/auth/logout-all', () => {
    it('should logout from all devices', async () => {
      // Create user and login multiple times
      const email = `logout-all-${Date.now()}@iwent.test`;
      await createTestUser({
        email,
        password: 'LogoutAllPass123!',
      });

      // Login twice to create multiple refresh tokens
      const login1 = await request(app.server)
        .post('/api/v1/auth/login')
        .send({ email, password: 'LogoutAllPass123!' });

      const login2 = await request(app.server)
        .post('/api/v1/auth/login')
        .send({ email, password: 'LogoutAllPass123!' });

      const accessToken = login2.body.data.tokens.accessToken;
      const refreshToken1 = login1.body.data.tokens.refreshToken;
      const refreshToken2 = login2.body.data.tokens.refreshToken;

      // Logout all
      await request(app.server)
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Both refresh tokens should be revoked
      await request(app.server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: refreshToken1 })
        .expect(401);

      await request(app.server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: refreshToken2 })
        .expect(401);
    });

    it('should require authentication', async () => {
      await request(app.server)
        .post('/api/v1/auth/logout-all')
        .expect(401);
    });
  });

  // =========================================================================
  // AUTH STATUS ENDPOINT
  // =========================================================================
  describe('GET /api/v1/auth/status', () => {
    it('should return auth module status', async () => {
      const response = await request(app.server)
        .get('/api/v1/auth/status')
        .expect(200);

      expect(response.body).toMatchObject({
        module: 'auth',
        status: 'active',
        endpoints: expect.any(Array),
      });
    });
  });

  // =========================================================================
  // PROTECTED ROUTES TESTS
  // =========================================================================
  describe('Protected Routes', () => {
    let userToken: string;
    const testEmail = 'protected-test@iwent.test';

    beforeAll(async () => {
      // Create user and login
      await createTestUser({
        email: testEmail,
        password: 'ProtectedPass123!',
      });

      const loginResponse = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'ProtectedPass123!',
        });

      userToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should access protected route with valid token', async () => {
      const response = await authRequest(app, userToken)
        .get('/api/v1/users/me')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testEmail);
    });

    it('should reject request without token', async () => {
      await request(app.server)
        .get('/api/v1/users/me')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app.server)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject request with malformed token', async () => {
      await request(app.server)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer')
        .expect(401);
    });
  });
});
