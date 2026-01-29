import { hash, verify } from '@node-rs/argon2';

/**
 * Password Utilities
 * Uses Argon2id for password hashing (OWASP recommended)
 */

// OWASP recommended parameters for Argon2id
const ARGON2_OPTIONS = {
  memoryCost: 19456,  // 19MB memory
  timeCost: 2,        // 2 iterations
  parallelism: 1,     // 1 thread
};

/**
 * Hash a password using Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/**
 * Verify a password against its Argon2id hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await verify(hashedPassword, password);
  } catch {
    return false;
  }
}
