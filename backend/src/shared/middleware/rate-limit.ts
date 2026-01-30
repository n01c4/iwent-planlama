import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

/**
 * Rate Limiting Configuration
 *
 * Auth endpoints: 5 requests per minute
 * Authenticated endpoints: 300 requests per minute
 */

export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    global: true,
    max: 300, // Default: 300 requests per minute for authenticated users
    timeWindow: '1 minute',
    errorResponseBuilder: (_request, context) => ({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. You can make ${context.max} requests per ${context.after}. Please try again later.`,
      },
    }),
    keyGenerator: (request) => {
      // Use user ID for authenticated requests, IP for anonymous
      return request.user?.sub || request.ip;
    },
  });
}

/**
 * Stricter rate limit for auth endpoints
 * 5 requests per minute
 */
export const authRateLimitConfig = {
  max: 5,
  timeWindow: '1 minute',
};

/**
 * Standard rate limit for authenticated endpoints
 * 300 requests per minute
 */
export const standardRateLimitConfig = {
  max: 300,
  timeWindow: '1 minute',
};

/**
 * NLP Search rate limit - Phase 8
 * Lower limit due to AI API costs and resources
 * Authenticated: 30 requests per minute
 * Public: 10 requests per minute
 */
export const nlpSearchRateLimitConfig = {
  authenticated: {
    max: 30,
    timeWindow: '1 minute',
  },
  public: {
    max: 10,
    timeWindow: '1 minute',
  },
};
