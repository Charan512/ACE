import { Redis } from 'ioredis';

/**
 * Creates a configured ioredis client from REDIS_URL environment variable.
 *
 * BullMQ requires a factory function (not a shared instance) for its connection
 * option, so we export a factory `createRedisConnection` in addition to
 * a shared `redis` singleton for direct key-value operations (treasurer metadata, etc.).
 *
 * Local:    redis://127.0.0.1:6379
 * Upstash:  rediss://:<password>@hostname:port   (TLS, note the double 's')
 */

const REDIS_OPTIONS = {
  maxRetriesPerRequest: null, // Required by BullMQ — lets it manage retries itself
  enableReadyCheck: false,    // Required by BullMQ
  lazyConnect: true,          // Connect on first command, not on import
};

/**
 * Shared Redis singleton — used for direct operations (e.g., treasurer metadata hset/hget).
 * NOT passed to BullMQ directly (BullMQ needs its own connection instances).
 */
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', REDIS_OPTIONS);

redis.on('connect', () => console.log('✅ Redis connected.'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));
redis.on('reconnecting', () => console.warn('⚠️  Redis reconnecting...'));

/**
 * Factory function for BullMQ connections.
 * BullMQ internally calls this to create separate connections for
 * the Queue producer and Worker consumer — they must not share an ioredis instance.
 *
 * @returns {Redis} A new ioredis client
 */
export const createRedisConnection = () =>
  new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', REDIS_OPTIONS);

export default redis;
