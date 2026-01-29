import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/index.js';

/**
 * JWT Utilities
 * Access Token: 15 min TTL
 * Refresh Token: 7 days TTL
 */

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: 'public' | 'user' | 'organizer' | 'admin';
  organizerId?: string;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET!, options);
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET!, options);
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(
  user: { id: string; email: string; role: 'public' | 'user' | 'organizer' | 'admin'; organizerId?: string },
  tokenId: string
): TokenPair {
  const accessToken = generateAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    organizerId: user.organizerId,
  });

  const refreshToken = generateRefreshToken({
    sub: user.id,
    tokenId,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): AccessTokenPayload & { iat: number; exp: number } {
  return jwt.verify(token, env.JWT_SECRET!) as AccessTokenPayload & { iat: number; exp: number };
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload & { iat: number; exp: number } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET!) as RefreshTokenPayload & { iat: number; exp: number };
}

/**
 * Hash a refresh token for storage (SHA-256)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a random verification code (6 digits)
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a random reset token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Parse expiration string to milliseconds
 */
export function parseExpiration(exp: string): number {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // default 15 min

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 15 * 60 * 1000;
  }
}
