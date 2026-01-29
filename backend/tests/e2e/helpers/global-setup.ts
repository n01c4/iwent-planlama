/**
 * Global Setup - Runs once before all tests
 */
import { connectDb, cleanDb, seedDb } from './db-utils';
import * as dotenv from 'dotenv';
import * as path from 'path';

export default async function globalSetup(): Promise<void> {
  console.log('\n========================================');
  console.log('  iWent E2E Test Suite - Setup');
  console.log('========================================\n');

  // Load test environment (use process.cwd() which is the backend directory)
  const envPath = path.resolve(process.cwd(), '.env.test');
  dotenv.config({ path: envPath });

  // Fallback to .env if .env.test doesn't exist
  if (!process.env.DATABASE_URL) {
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  }

  // Validate required environment variables
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  // Safety check - prevent running on production
  const dbUrl = process.env.DATABASE_URL || '';
  if (
    dbUrl.includes('prod') ||
    dbUrl.includes('production') ||
    (process.env.NODE_ENV === 'production' && !dbUrl.includes('test'))
  ) {
    throw new Error('SAFETY: Refusing to run E2E tests on production database!');
  }

  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Database:', dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

  // Connect and setup database
  await connectDb();
  await cleanDb();
  await seedDb();

  console.log('\nGlobal setup complete\n');
}
