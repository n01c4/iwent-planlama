export { startOrderExpirationJob, runOrderExpirationJob } from './order-expiration.job.js';

/**
 * Start all background jobs
 */
export function startAllJobs(): void {
  const { startOrderExpirationJob } = require('./order-expiration.job.js');
  startOrderExpirationJob();
}
