/**
 * Auth Utilities for E2E Testing
 * Handles user registration, login, and token management
 */
import request from 'supertest';
import type { FastifyInstance } from 'fastify';

// Token storage for tests
let cachedTokens: Map<string, AuthTokens> = new Map();

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Register a new user via API
 */
export async function registerUser(
  app: FastifyInstance,
  credentials: LoginCredentials & { name?: string }
): Promise<AuthTokens> {
  const response = await request(app.server)
    .post('/api/v1/auth/register')
    .send({
      email: credentials.email,
      password: credentials.password,
      name: credentials.name || 'Test User',
    })
    .expect(201);

  const tokens: AuthTokens = {
    accessToken: response.body.data.accessToken,
    refreshToken: response.body.data.refreshToken,
    expiresIn: response.body.data.expiresIn,
  };

  // Cache tokens
  cachedTokens.set(credentials.email, tokens);

  return tokens;
}

/**
 * Login user via API
 */
export async function loginUser(
  app: FastifyInstance,
  credentials: LoginCredentials
): Promise<AuthTokens> {
  // Check cache first
  const cached = cachedTokens.get(credentials.email);
  if (cached) {
    return cached;
  }

  const response = await request(app.server)
    .post('/api/v1/auth/login')
    .send({
      email: credentials.email,
      password: credentials.password,
    })
    .expect(200);

  const tokens: AuthTokens = {
    accessToken: response.body.data.accessToken,
    refreshToken: response.body.data.refreshToken,
    expiresIn: response.body.data.expiresIn,
  };

  // Cache tokens
  cachedTokens.set(credentials.email, tokens);

  return tokens;
}

/**
 * Refresh access token
 */
export async function refreshToken(
  app: FastifyInstance,
  refreshTokenValue: string
): Promise<AuthTokens> {
  const response = await request(app.server)
    .post('/api/v1/auth/refresh')
    .send({ refreshToken: refreshTokenValue })
    .expect(200);

  return {
    accessToken: response.body.data.accessToken,
    refreshToken: response.body.data.refreshToken,
    expiresIn: response.body.data.expiresIn,
  };
}

/**
 * Logout user
 */
export async function logoutUser(
  app: FastifyInstance,
  refreshTokenValue: string
): Promise<void> {
  await request(app.server)
    .post('/api/v1/auth/logout')
    .send({ refreshToken: refreshTokenValue })
    .expect(200);
}

/**
 * Get access token for a user (register or login)
 */
export async function getAccessToken(
  app: FastifyInstance,
  credentials: LoginCredentials
): Promise<string> {
  try {
    const tokens = await loginUser(app, credentials);
    return tokens.accessToken;
  } catch {
    // User might not exist, try to register
    const tokens = await registerUser(app, credentials);
    return tokens.accessToken;
  }
}

/**
 * Create authorized request with Bearer token
 */
export function authRequest(app: FastifyInstance, token: string) {
  return {
    get: (url: string) =>
      request(app.server)
        .get(url)
        .set('Authorization', `Bearer ${token}`),
    post: (url: string) =>
      request(app.server)
        .post(url)
        .set('Authorization', `Bearer ${token}`),
    put: (url: string) =>
      request(app.server)
        .put(url)
        .set('Authorization', `Bearer ${token}`),
    patch: (url: string) =>
      request(app.server)
        .patch(url)
        .set('Authorization', `Bearer ${token}`),
    delete: (url: string) =>
      request(app.server)
        .delete(url)
        .set('Authorization', `Bearer ${token}`),
  };
}

/**
 * Clear cached tokens (for test cleanup)
 */
export function clearTokenCache(): void {
  cachedTokens.clear();
}

/**
 * Get admin token - creates admin user if needed
 */
export async function getAdminToken(app: FastifyInstance): Promise<string> {
  const adminCredentials = {
    email: 'admin@iwent.test',
    password: 'Admin123!',
  };

  return getAccessToken(app, adminCredentials);
}

/**
 * Get organizer token - creates organizer user if needed
 */
export async function getOrganizerToken(
  app: FastifyInstance,
  email?: string
): Promise<{ token: string; userId: string }> {
  const credentials = {
    email: email || `organizer-${Date.now()}@iwent.test`,
    password: 'OrgPass123!',
    name: 'Test Organizer',
  };

  // Register user
  const response = await request(app.server)
    .post('/api/v1/auth/register')
    .send(credentials);

  if (response.status !== 201) {
    // Try login instead
    const loginResponse = await request(app.server)
      .post('/api/v1/auth/login')
      .send({
        email: credentials.email,
        password: credentials.password,
      })
      .expect(200);

    return {
      token: loginResponse.body.data.accessToken,
      userId: loginResponse.body.data.user.id,
    };
  }

  const token = response.body.data.accessToken;
  const userId = response.body.data.user.id;

  // Create organizer profile
  await request(app.server)
    .post('/api/v1/org/profile')
    .set('Authorization', `Bearer ${token}`)
    .send({
      businessName: 'Test Organization',
      city: 'Istanbul',
    });

  // Re-login to get updated token with organizer role
  const loginResponse = await request(app.server)
    .post('/api/v1/auth/login')
    .send({
      email: credentials.email,
      password: credentials.password,
    })
    .expect(200);

  return {
    token: loginResponse.body.data.accessToken,
    userId: loginResponse.body.data.user.id,
  };
}
