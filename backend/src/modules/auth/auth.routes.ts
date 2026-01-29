import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type RegisterInput,
  type LoginInput,
  type RefreshTokenInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from './auth.schema.js';
import { requireAuth } from '../../shared/middleware/index.js';
import { ValidationError } from '../../shared/utils/errors.js';

/**
 * Helper to get client IP address
 */
function getClientIp(request: FastifyRequest): string | undefined {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return request.ip;
}

/**
 * Helper to validate request body with Zod
 */
function validateBody<T>(schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: { flatten: () => { fieldErrors: unknown } } } }, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error?.flatten().fieldErrors);
  }
  return result.data as T;
}

/**
 * Auth Routes
 * Prefix: /api/v1/auth
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /auth/register
   * Create a new user account
   */
  app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const input = validateBody<RegisterInput>(registerSchema, request.body);
    const ipAddress = getClientIp(request);

    const result = await authService.register(input, ipAddress);

    return reply.status(201).send({
      success: true,
      data: result,
    });
  });

  /**
   * POST /auth/login
   * Authenticate user and return tokens
   */
  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const input = validateBody<LoginInput>(loginSchema, request.body);
    const ipAddress = getClientIp(request);

    const result = await authService.login(input, ipAddress);

    return reply.send({
      success: true,
      data: result,
    });
  });

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token (with rotation)
   */
  app.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const input = validateBody<RefreshTokenInput>(refreshTokenSchema, request.body);
    const ipAddress = getClientIp(request);

    const result = await authService.refresh(input, ipAddress);

    return reply.send({
      success: true,
      data: result,
    });
  });

  /**
   * POST /auth/logout
   * Revoke the refresh token
   */
  app.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    const input = validateBody<RefreshTokenInput>(refreshTokenSchema, request.body);

    await authService.logout(input.refreshToken);

    return reply.send({
      success: true,
      message: 'Logged out successfully',
    });
  });

  /**
   * POST /auth/logout-all
   * Revoke all refresh tokens for the authenticated user
   */
  app.post('/logout-all', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    await authService.logoutAll(request.user!.sub);

    return reply.send({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  });

  /**
   * POST /auth/password/forgot
   * Request password reset email
   */
  app.post('/password/forgot', async (request: FastifyRequest, reply: FastifyReply) => {
    const input = validateBody<ForgotPasswordInput>(forgotPasswordSchema, request.body);

    await authService.forgotPassword(input);

    // Always return success to prevent email enumeration
    return reply.send({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
    });
  });

  /**
   * POST /auth/password/reset
   * Reset password using token
   */
  app.post('/password/reset', async (request: FastifyRequest, reply: FastifyReply) => {
    const input = validateBody<ResetPasswordInput>(resetPasswordSchema, request.body);

    await authService.resetPassword(input);

    return reply.send({
      success: true,
      message: 'Password has been reset successfully',
    });
  });

  /**
   * POST /auth/verify/email
   * Verify email address with 6-digit code
   */
  app.post('/verify/email', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const input = validateBody<VerifyEmailInput>(verifyEmailSchema, request.body);

    await authService.verifyEmail(request.user!.sub, input);

    return reply.send({
      success: true,
      message: 'Email verified successfully',
    });
  });

  /**
   * POST /auth/verify/email/resend
   * Resend email verification code
   */
  app.post('/verify/email/resend', {
    preHandler: [requireAuth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    await authService.resendVerificationEmail(request.user!.sub);

    return reply.send({
      success: true,
      message: 'Verification email sent',
    });
  });

  /**
   * GET /auth/status
   * Check auth module status (for debugging)
   */
  app.get('/status', async () => ({
    module: 'auth',
    status: 'active',
    endpoints: [
      'POST /register',
      'POST /login',
      'POST /refresh',
      'POST /logout',
      'POST /logout-all',
      'POST /password/forgot',
      'POST /password/reset',
      'POST /verify/email',
      'POST /verify/email/resend',
    ],
  }));
}
