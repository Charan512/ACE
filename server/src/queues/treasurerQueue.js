import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';

/**
 * Queue for the Treasurer Digest.
 * Used to debounce and bundle cash registration notifications.
 */
const treasurerQueue = new Queue('ace-treasurer', {
  connection: createRedisConnection(),
});

export default treasurerQueue;
