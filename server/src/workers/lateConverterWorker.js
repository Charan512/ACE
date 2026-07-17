import { Worker } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Registration from '../models/Registration.js'; // BUG-02 FIX

/**
 * Late Converter Worker — Migrates Guest History to Member Vault.
 *
 * Runs when a user buys a membership. They may have attended events previously
 * as a guest (where their email was stored in guestEmail on the transaction,
 * but user was null). This worker retroactively links those transactions to
 * their new user account and pushes the attendance records to their Member Vault.
 *
 * BUG-02 FIX: Also migrates Registration records so the admin roster no longer
 * shows the person as a guest, and so the duplicate-registration guard in
 * cashRegisterMember (which checks userId) works correctly.
 */
const lateConverterWorker = new Worker(
  'ace-late-converter',
  async (job) => {
    const { userId, email } = job.data;
    console.log(`[LateConverterWorker] Starting migration for ${email} (User: ${userId})`);

    // Guard: only members have a history vault. If the user was immediately promoted
    // to SBM or EBM before this job ran, skip the migration — pushing history would
    // be silently stripped by the pre('validate') firewall, leaving data in limbo.
    const user = await User.findById(userId).select('role').lean();
    if (!user) {
      console.warn(`[LateConverterWorker] User ${userId} not found. Skipping migration.`);
      return;
    }
    if (user.role !== 'member') {
      console.log(
        `[LateConverterWorker] User ${userId} has role '${user.role}' — ` +
        `history vault does not apply. Skipping migration.`
      );
      return;
    }

    // 1. Find all paid transactions linked to this email where the user is currently null
    const guestTransactions = await Transaction.find({
      guestEmail: email,
      status:     'paid',
      user:       null, // Only migrate unlinked transactions
    }).lean();

    if (guestTransactions.length === 0) {
      console.log(`[LateConverterWorker] No historical guest transactions found for ${email}.`);
      return;
    }

    console.log(`[LateConverterWorker] Found ${guestTransactions.length} historical transaction(s). Migrating...`);

    // 2. Start atomic session — all-or-nothing migration
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transactionIds = guestTransactions.map((tx) => tx._id);

      // Link all historical Transactions to the new User account
      await Transaction.updateMany(
        { _id: { $in: transactionIds } },
        { $set: { user: userId } },
        { session }
      );

      // Build attendedEvents vault entries from historical transactions
      const vaultEntries = guestTransactions
        .filter((tx) => tx.event) // Skip membership transactions that have no event
        .map((tx) => ({
          event:       tx.event,
          transaction: tx._id,
          attendedAt:  tx.processedAt || new Date(),
        }));

      if (vaultEntries.length > 0) {
        await User.findByIdAndUpdate(
          userId,
          { $push: { 'history.attendedEvents': { $each: vaultEntries } } },
          { session }
        );
      }

      // BUG-02 FIX: Update Registration records — link userId and clear guest fields.
      // Without this, after a guest buys a membership:
      //   - Admin roster permanently shows them as a guest (userId=null).
      //   - cashRegisterMember duplicate guard (checks userId) misses prior guest
      //     registrations, allowing the same person to be double-registered.
      const regResult = await Registration.updateMany(
        { guestEmail: email.toLowerCase(), userId: null },
        {
          $set: {
            userId:    userId,
            // Keep guestName/guestEmail on document for historical reference;
            // the userId field is what the roster queries on.
          },
        },
        { session }
      );

      await session.commitTransaction();

      console.log(
        `[LateConverterWorker] ✓ Migration complete for ${email}: ` +
        `${guestTransactions.length} transaction(s), ` +
        `${vaultEntries.length} vault entry(s), ` +
        `${regResult.modifiedCount} registration(s) linked to user ${userId}.`
      );
    } catch (error) {
      await session.abortTransaction();
      throw new Error(`Migration aborted for ${email}: ${error.message}`);
    } finally {
      session.endSession();
    }
  },
  {
    connection:  createRedisConnection(),
    concurrency: 2, // Low concurrency — each job does multiple DB writes
    settings: {
      stalledInterval: 300000,
      maxStalledCount: 1,
    }
  }
);

lateConverterWorker.on('completed', (job) => {
  console.log(`[LateConverterWorker] Job complete (id: ${job.id})`);
});

lateConverterWorker.on('failed', (job, err) => {
  console.error(`[LateConverterWorker] Job failed (id: ${job?.id}): ${err.message}`);
});

export default lateConverterWorker;
