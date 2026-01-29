/**
 * Global Teardown - Runs once after all tests
 */
import { disconnectDb } from './db-utils';

export default async function globalTeardown(): Promise<void> {
  console.log('\n========================================');
  console.log('  iWent E2E Test Suite - Teardown');
  console.log('========================================\n');

  // Disconnect from database
  await disconnectDb();

  console.log('Global teardown complete\n');
}
