import type { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

// Placeholder types - will be expanded when auth is implemented
export interface JwtPayload {
  sub: string;
  email: string;
  role: 'public' | 'user' | 'organizer' | 'admin';
  organizerId?: string;
  iat: number;
  exp: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

/**
 * Middleware: Require authentication
 * Will be implemented in auth module
 */
export async function requireAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  // TODO: Implement JWT verification
  // For now, just check if Authorization header exists
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }

  // TODO: Verify JWT and set request.user
  // const token = authHeader.slice(7);
  // request.user = verifyToken(token);
}

/**
 * Middleware: Require specific role(s)
 */
export function requireRole(...roles: JwtPayload['role'][]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(request.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
  };
}

/**
 * Middleware: Optional authentication
 * Sets request.user if valid token provided, but doesn't fail if missing
 */
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return; // No auth, continue without user
  }

  // TODO: Verify JWT and set request.user if valid
  // try {
  //   const token = authHeader.slice(7);
  //   request.user = verifyToken(token);
  // } catch {
  //   // Invalid token, continue without user
  // }
}
