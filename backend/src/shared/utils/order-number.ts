import { randomBytes } from 'crypto';

/**
 * Generate a unique order number
 * Format: ORD-{YYYY}-{RANDOM6}
 * Example: ORD-2026-A3B7C9
 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${year}-${random}`;
}
