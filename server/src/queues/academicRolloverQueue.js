import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';

/**
 * Academic Rollover Queue — Runs every April 1st.
 *
 * Jobs:
 *   - Increment academic `year` for all active members by 1.
 *   - Permanently delete members who have graduated (based on aceId prefix + studentType).
 *   - The aceId counter prefix auto-rolls over in generateAceId() — no extra job needed.
 *
 * Job name: 'academicRollover'
 * Schedule: Cron '0 0 1 4 *' (midnight April 1st, every year)
 */
const academicRolloverQueue = new Queue('ace-academic-rollover', {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60_000, // 1 min → 2 min → 4 min
    },
    removeOnComplete: { count: 50 },
    removeOnFail:     { count: 100 },
  },
});

export default academicRolloverQueue;
