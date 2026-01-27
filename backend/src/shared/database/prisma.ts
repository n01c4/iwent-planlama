import { env } from '../config/index.js';

// Lazy-loaded Prisma client type
type PrismaClientType = import('@prisma/client').PrismaClient;

let prismaInstance: PrismaClientType | null = null;

/**
 * Get Prisma client instance (lazy loaded)
 * This allows the app to start even without Prisma being generated
 */
export function getPrisma(): PrismaClientType {
  if (!prismaInstance) {
    // Dynamic import to avoid errors when Prisma is not generated
    const { PrismaClient } = require('@prisma/client');
    prismaInstance = new PrismaClient({
      log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prismaInstance as PrismaClientType;
}

/**
 * Prisma client getter (for backwards compatibility)
 * Use getPrisma() for lazy loading
 */
export const prisma = new Proxy({} as PrismaClientType, {
  get(_target, prop) {
    return getPrisma()[prop as keyof PrismaClientType];
  },
});

export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}
