import { Worker } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import redis from '../config/redis.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import sendEmail from '../utils/mailer.js';
import { buildTreasurerDigestEmail } from '../utils/emailTemplates.js';
import { TREASURER_META_KEY } from '../queues/treasurerQueue.js';

/**
 * Treasurer Worker — processes the delayed flush job.
 *
 * This worker executes ONLY when the Debounce 2.5h timer expires
 * or the 10-hour absolute ceiling is hit.
 *
 * Logic:
 *  1. Read metadata from Redis to establish the query window.
 *  2. Fetch all 'paid' transactions since firstRegistrationAt.
 *  3. Send the digest email to the Treasurer.
 *  4. Atomically reset the Redis metadata (clear firstRegistrationAt & count).
 */
const treasurerWorker = new Worker(
  'ace-treasurer',
  async (job) => {
    const { forcedByCeiling } = job.data;
    console.log(`[TreasurerWorker] Starting digest flush (Forced by ceiling: ${forcedByCeiling})`);

    // ── 1. Read metadata window ──────────────────────────────
    const meta = await redis.hgetall(TREASURER_META_KEY);
    const firstAt = parseInt(meta.firstRegistrationAt);
    const pendingCount = parseInt(meta.pendingCount);

    if (!firstAt || pendingCount === 0) {
      console.log('[TreasurerWorker] No pending registrations to flush. Exiting.');
      return;
    }

    // ── 2. Query Transactions ────────────────────────────────
    // We fetch all successful transactions that occurred since the first payment in this window.
    const transactions = await Transaction.find({
      status: 'paid',
      processedAt: { $gte: new Date(firstAt) },
    })
      .populate('user', 'name email aceId')
      .populate('event', 'title')
      .sort({ processedAt: 1 })
      .lean();

    if (transactions.length === 0) {
      console.warn('[TreasurerWorker] Metadata indicated pending registrations, but DB returned 0.');
    } else {
      // ── 3. Resolve treasurer email from DB ─────────────────
      // Treasurer is not an env var — it is derived from the User collection.
      // A user seeded/assigned the 'Treasurer' designation is the recipient.
      const treasurerUser = await User.findOne({ designation: 'Treasurer' })
        .select('email name')
        .lean();

      if (!treasurerUser) {
        console.error('[TreasurerWorker] No user with designation "Treasurer" found in DB. Digest email aborted.');
        return;
      }

      const treasurerEmail = treasurerUser.email;

      // ── 4. Build & Send Email ──────────────────────────────
      const emailContent = buildTreasurerDigestEmail(transactions, {
        firstRegistrationAt: firstAt,
        pendingCount,
        forcedByCeiling,
      });

      await sendEmail({
        to: treasurerEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      console.log(`[TreasurerWorker] Digest sent to ${treasurerEmail} (${treasurerUser.name}) with ${transactions.length} records.`);
    }

    // ── 4. Reset Redis Metadata ──────────────────────────────
    // After a successful flush, clear the counters so the next registration
    // establishes a new firstRegistrationAt.
    await redis.hset(TREASURER_META_KEY, {
      firstRegistrationAt: 0,
      pendingCount: 0,
    });
    console.log('[TreasurerWorker] Redis metadata reset.');
  },
  {
    connection: createRedisConnection(),
    concurrency: 1, // Must be 1 to prevent overlapping flushes
  }
);

treasurerWorker.on('completed', (job) => {
  console.log(`[TreasurerWorker] Flush complete (id: ${job.id})`);
});

treasurerWorker.on('failed', (job, err) => {
  console.error(`[TreasurerWorker] Flush failed (id: ${job?.id}): ${err.message}`);
});

export default treasurerWorker;
