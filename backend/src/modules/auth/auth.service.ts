import { prisma } from '../../shared/database/index.js';
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from './auth.schema.js';

/**
 * Auth Service
 * Handles authentication business logic
 * Will be implemented in the next step
 */
export class AuthService {
  async register(_input: RegisterInput) {
    // TODO: Implement
    // 1. Check if user exists
    // 2. Hash password (argon2)
    // 3. Create user
    // 4. Generate tokens
    // 5. Send verification email
    throw new Error('Not implemented');
  }

  async login(_input: LoginInput) {
    // TODO: Implement
    // 1. Find user by email
    // 2. Verify password
    // 3. Generate tokens
    // 4. Update last_login
    throw new Error('Not implemented');
  }

  async refresh(_input: RefreshTokenInput) {
    // TODO: Implement
    // 1. Verify refresh token
    // 2. Check if revoked
    // 3. Rotate token
    // 4. Return new tokens
    throw new Error('Not implemented');
  }

  async logout(_userId: string, _refreshToken: string) {
    // TODO: Implement
    // 1. Revoke refresh token
    throw new Error('Not implemented');
  }

  async forgotPassword(_input: ForgotPasswordInput) {
    // TODO: Implement
    // 1. Find user
    // 2. Generate reset token
    // 3. Send email
    throw new Error('Not implemented');
  }

  async resetPassword(_input: ResetPasswordInput) {
    // TODO: Implement
    // 1. Verify token
    // 2. Hash new password
    // 3. Update user
    // 4. Invalidate token
    throw new Error('Not implemented');
  }

  async verifyEmail(_userId: string, _input: VerifyEmailInput) {
    // TODO: Implement
    // 1. Verify code
    // 2. Update email_verified
    throw new Error('Not implemented');
  }
}

export const authService = new AuthService();
