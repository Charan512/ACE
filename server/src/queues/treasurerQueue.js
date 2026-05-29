import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import redis from '../config/redis.js';

// ── Constants ──────────────────────────────────────────────────
export const TREASURER_JOB_ID = 'treasurer-digest-flush';
export const DEBOUNCE_DELAY_MS = 2.5 * 60 * 60 * 1000;  // 2.5 hours
export const CEILING_MS = 10 * 60 * 60 * 1000;           // 10 hours absolute ceiling
export const TREASURER_META_KEY = 'ace:treasurer:meta';

/**
 * Treasurer Digest Queue — implements the Debounce & Flush pattern.
 *
 * Rules (from project_architecture.md):
 *   1. Trigger:    New registration → schedule a flush job for 2.5 hours from now.
 *   2. Reset:      Subsequent registration → remove the pending job, reschedule for 2.5h.
 *   3. Ceiling:    If the OLDEST pending registration is ≥10h old → flush IMMEDIATELY (delay: 0).
 *
 * This queue holds at most ONE active job at any time (enforced by TREASURER_JOB_ID).
 * NEVER use setTimeout/setInterval for this logic.
 */
const treasurerQueue = new Queue('ace-treasurer', {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});

/**
 * Schedules or resets the Treasurer Digest flush job.
 *
 * Call this every time a payment succeeds. It will:
 *  1. Update metadata (firstRegistrationAt, pendingCount) in Redis
 *  2. Remove the currently pending delayed job (if any) to reset the 2.5h timer
 *  3. Check the 10-hour ceiling — if breached, schedule an immediate flush (delay: 0)
 *  4. Otherwise, schedule a new delayed job for 2.5h from now
 *
 * @param {Object} opts
 * @param {string}  opts.transactionId - ID of the triggering transaction (for logs)
 */
export const scheduleTreasurerFlush = async ({ transactionId }) => {
  const nowMs = Date.now();

  // ── 1. Update Redis metadata ─────────────────────────────
  const existing = await redis.hgetall(TREASURER_META_KEY);
  const firstAt = parseInt(existing.firstRegistrationAt) || nowMs;
  const pendingCount = (parseInt(existing.pendingCount) || 0) + 1;

  await redis.hset(TREASURER_META_KEY, {
    firstRegistrationAt: firstAt,
    lastRegistrationAt: nowMs,
    pendingCount,
  });

  // ── 2. Remove existing delayed job (timer reset) ──────────
  try {
    const existingJob = await treasurerQueue.getJob(TREASURER_JOB_ID);
    if (existingJob) {
      const state = await existingJob.getState();
      // Only remove if it's still waiting (delayed/waiting) — not if it's already processing
      if (['delayed', 'waiting'].includes(state)) {
        await existingJob.remove();
        console.log(`[TreasurerQueue] Existing job removed. Timer reset. (triggeredBy: ${transactionId})`);
      }
    }
  } catch (err) {
    console.warn('[TreasurerQueue] Could not remove existing job:', err.message);
  }

  // ── 3. Check 10-hour ceiling ──────────────────────────────
  const ageMs = nowMs - firstAt;
  const hasHitCeiling = ageMs >= CEILING_MS;

  if (hasHitCeiling) {
    console.log(`[TreasurerQueue] 10-hour ceiling reached. Scheduling immediate flush.`);
  }

  // ── 4. Schedule new job ───────────────────────────────────
  await treasurerQueue.add(
    'flush',
    {
      triggeredAt: nowMs,
      triggeredBy: transactionId,
      forcedByCeiling: hasHitCeiling,
    },
    {
      jobId: TREASURER_JOB_ID,  // Ensures at-most-one pending flush job
      delay: hasHitCeiling ? 0 : DEBOUNCE_DELAY_MS,
      removeOnComplete: true,
      removeOnFail: false,       // Keep failed jobs for manual retry
    }
  );

  console.log(
    `[TreasurerQueue] Flush job scheduled. Delay: ${hasHitCeiling ? 'IMMEDIATE' : '2.5h'}. ` +
    `Pending registrations: ${pendingCount}`
  );
};

export default treasurerQueue;
