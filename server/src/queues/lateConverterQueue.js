import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';

/**
 * Late Converter Queue — handles Guest → Member history migration.
 *
 * Triggered when a guest who previously attended events as a guest
 * purchases an ACE Membership. The worker scans all their past
 * Transaction records (by guestEmail) and injects them into the
 * new User's Member Vault automatically.
 *
 * Job data: { userId, email }
 *
 * NEVER use setTimeout/setInterval for this migration.
 */
const lateConverterQueue = new Queue('ace-late-converter', {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 5,            // Retry aggressively — data integrity is critical
    backoff: {
      type: 'exponential',
      delay: 30_000,        // 30s → 60s → 120s → 240s → 480s
    },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 }, // Keep all failures for manual audit
  },
});

export default lateConverterQueue;
