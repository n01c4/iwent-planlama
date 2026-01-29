import type { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { verifyAccessToken, type AccessTokenPayload } from '../utils/jwt.js';

export interface JwtPayload extends AccessTokenPayload {
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
 * Verifies JWT access token from Authorization header
 */
export async function requireAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    request.user = payload;
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token expired', 'TOKEN_EXPIRED');
    }
    throw new UnauthorizedError('Invalid token', 'INVALID_TOKEN');
  }
}

/**
 * Middleware: Require specific role(s)
 * Must be used after requireAuth
 */
export function requireRole(...roles: JwtPayload['role'][]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Role hierarchy: admin > organizer > user > public
    const roleHierarchy: Record<string, number> = {
      public: 0,
      user: 1,
      organizer: 2,
      admin: 3,
    };

    const userRoleLevel = roleHierarchy[request.user.role] ?? 0;
    const hasPermission = roles.some(role => userRoleLevel >= roleHierarchy[role]);

    if (!hasPermission) {
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
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    request.user = payload;
  } catch {
    // Invalid token, continue without user
  }
}
