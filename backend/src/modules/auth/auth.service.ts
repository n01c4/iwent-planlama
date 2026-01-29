import { prisma } from '../../shared/database/index.js';
import {
  hashPassword,
  verifyPassword,
  generateTokenPair,
  verifyRefreshToken,
  hashToken,
  generateVerificationCode,
  generateResetToken,
  parseExpiration,
} from '../../shared/utils/index.js';
import { env } from '../../shared/config/index.js';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from '../../shared/utils/errors.js';
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from './auth.schema.js';

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: 'public' | 'user' | 'organizer' | 'admin';
    emailVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput, ipAddress?: string): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Generate email verification code
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name,
        city: input.city,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Generate tokens
    const tokenId = crypto.randomUUID();
    const tokens = generateTokenPair(
      { id: user.id, email: user.email, role: user.role },
      tokenId
    );

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        id: tokenId,
        userId: user.id,
        tokenHash: hashToken(tokens.refreshToken),
        ipAddress,
        expiresAt: new Date(Date.now() + parseExpiration(env.JWT_REFRESH_EXPIRES_IN)),
      },
    });

    // TODO: Send verification email (placeholder)
    console.log(`[EMAIL] Verification code for ${user.email}: ${verificationCode}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      tokens,
    };
  }

  /**
   * Login with email and password
   */
  async login(input: LoginInput, ipAddress?: string): Promise<AuthResult> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is soft-deleted
    if (user.deletedAt) {
      throw new UnauthorizedError('Account has been deactivated');
    }

    // Verify password
    const isValidPassword = await verifyPassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const tokenId = crypto.randomUUID();
    const tokens = generateTokenPair(
      { id: user.id, email: user.email, role: user.role },
      tokenId
    );

    // Store refresh token and update last login
    await Promise.all([
      prisma.refreshToken.create({
        data: {
          id: tokenId,
          userId: user.id,
          tokenHash: hashToken(tokens.refreshToken),
          ipAddress,
          expiresAt: new Date(Date.now() + parseExpiration(env.JWT_REFRESH_EXPIRES_IN)),
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress,
        },
      }),
    ]);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   * Implements token rotation for security
   */
  async refresh(input: RefreshTokenInput, ipAddress?: string): Promise<AuthResult> {
    let payload;
    try {
      payload = verifyRefreshToken(input.refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Find token in database
    const tokenHash = hashToken(input.refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Refresh token not found');
    }

    if (storedToken.revokedAt) {
      // Token reuse detected - revoke all tokens for this user
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedError('Token has been revoked - possible token reuse attack');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    const user = storedToken.user;

    if (user.deletedAt) {
      throw new UnauthorizedError('Account has been deactivated');
    }

    // Rotate: revoke old token, create new one
    const newTokenId = crypto.randomUUID();
    const tokens = generateTokenPair(
      { id: user.id, email: user.email, role: user.role },
      newTokenId
    );

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          id: newTokenId,
          userId: user.id,
          tokenHash: hashToken(tokens.refreshToken),
          ipAddress,
          expiresAt: new Date(Date.now() + parseExpiration(env.JWT_REFRESH_EXPIRES_IN)),
        },
      }),
    ]);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      tokens,
    };
  }

  /**
   * Logout by revoking refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);

    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Logout from all devices by revoking all refresh tokens
   */
  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Request password reset
   */
  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user || user.deletedAt) {
      return;
    }

    const resetToken = generateResetToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashToken(resetToken),
        passwordResetExpires: resetExpires,
      },
    });

    // TODO: Send password reset email (placeholder)
    console.log(`[EMAIL] Password reset token for ${user.email}: ${resetToken}`);
  }

  /**
   * Reset password with token
   */
  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenHash = hashToken(input.token);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpires: { gt: new Date() },
        deletedAt: null,
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(input.password);

    // Update password and invalidate all refresh tokens
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  /**
   * Verify email with code
   */
  async verifyEmail(userId: string, input: VerifyEmailInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestError('Email already verified');
    }

    if (
      user.emailVerificationCode !== input.code ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestError('Invalid or expired verification code');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpires: null,
      },
    });
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestError('Email already verified');
    }

    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
      },
    });

    // TODO: Send verification email (placeholder)
    console.log(`[EMAIL] New verification code for ${user.email}: ${verificationCode}`);
  }
}

export const authService = new AuthService();
