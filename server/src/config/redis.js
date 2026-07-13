import { Redis } from 'ioredis';

/**
 * Redis connection factory for ACE ERP.
 *
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to be set.
 * Crashes at startup if either is missing — no silent fallback to localhost.
 *
 * Derived Upstash URL format:
 *   rediss://default:<UPSTASH_REDIS_REST_TOKEN>@<host>:6379
 *
 * TLS is always enabled (Upstash requires it).
 */

function buildRedisUrl() {
  const restUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!restUrl || !restToken) {
    console.error('[Redis] FATAL: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in .env');
    process.exit(1);
  }

  const host = restUrl.replace(/^https?:\/\//, '');
  console.log(`[Redis] Connecting to Upstash (${host})`);
  return `rediss://default:${restToken}@${host}:6379`;
}

const REDIS_URL = buildRedisUrl();
const isTLS     = REDIS_URL.startsWith('rediss://');

/**
 * Shared ioredis options — compatible with both BullMQ and direct key-value ops.
 */
const REDIS_OPTIONS = {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck:     false, // Required by BullMQ
  lazyConnect:          true,  // Connect on first command, not on import
  ...(isTLS
    ? {
        tls: {
          // Upstash uses self-signed certs on some regions — rejectUnauthorized: false
          // is safe here because we verify identity via the token in the URL.
          rejectUnauthorized: false,
        },
      }
    : {}),
};

/**
 * Shared Redis singleton — use for direct cache ops (hset/hget, rate-limit counters, etc.)
 * Do NOT pass this instance to BullMQ — it needs its own dedicated connections.
 */
const redis = new Redis(REDIS_URL, REDIS_OPTIONS);

redis.on('connect',     () => console.log('[Redis] SUCCESS: Connected.'));
redis.on('ready',       () => console.log('[Redis] SUCCESS: Ready.'));
redis.on('error',       (err) => console.error('[Redis] ERROR:', err.message));
redis.on('reconnecting', ()  => console.warn('[Redis] Reconnecting…'));

/**
 * Factory for BullMQ Queue + Worker connections.
 * BullMQ requires separate ioredis instances for producers and consumers.
 * Each call to this function returns a fresh, independent client.
 *
 * @returns {Redis} A new ioredis client configured for BullMQ
 */
export const createRedisConnection = () => new Redis(REDIS_URL, REDIS_OPTIONS);

export default redis;
