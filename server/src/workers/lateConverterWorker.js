import { Worker } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

/**
 * Late Converter Worker — Migrates Guest History to Member Vault.
 *
 * Runs when a user buys a membership. They may have attended events previously
 * as a guest (where their email was stored in guestEmail on the transaction,
 * but user was null). This worker retroactively links those transactions to
 * their new user account and pushes the attendance records to their Member Vault.
 */
const lateConverterWorker = new Worker(
  'ace-late-converter',
  async (job) => {
    const { userId, email } = job.data;
    console.log(`[LateConverterWorker] Starting migration for ${email} (User: ${userId})`);

    // Guard: only members have a history vault. If the user was immediately promoted
    // to SBM or EBM before this job ran, skip the migration \u2014 pushing history would
    // be silently stripped by the pre('validate') firewall, leaving data in limbo.
    const user = await User.findById(userId).select('role').lean();
    if (!user) {
      console.warn(`[LateConverterWorker] User ${userId} not found. Skipping migration.`);
      return;
    }
    if (user.role !== 'member') {
      console.log(
        `[LateConverterWorker] User ${userId} has role '${user.role}' \u2014 ` +
        `history vault does not apply. Skipping migration.`
      );
      return;
    }

    // 1. Find all paid transactions linked to this email where the user is currently null
    const guestTransactions = await Transaction.find({
      guestEmail: email,
      status: 'paid',
      user: null, // Only migrate unlinked transactions
    }).lean();

    if (guestTransactions.length === 0) {
      console.log(`[LateConverterWorker] No historical guest transactions found for ${email}.`);
      return;
    }

    console.log(`[LateConverterWorker] Found ${guestTransactions.length} historical transactions. Migrating...`);

    // 2. Start atomic transaction session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transactionIds = guestTransactions.map((tx) => tx._id);
      
      // Update all transactions to link to the new user
      await Transaction.updateMany(
        { _id: { $in: transactionIds } },
        { $set: { user: userId } },
        { session }
      );

      // Build the attendedEvents array for the Member Vault
      const vaultEntries = guestTransactions.map((tx) => ({
        event: tx.event,
        transaction: tx._id,
        attendedAt: tx.processedAt || new Date(),
      }));

      // Push all historical events into the user's vault
      await User.findByIdAndUpdate(
        userId,
        { $push: { 'history.attendedEvents': { $each: vaultEntries } } },
        { session }
      );

      await session.commitTransaction();
      console.log(`[LateConverterWorker] Migrated ${guestTransactions.length} records for ${email}.`);
    } catch (error) {
      await session.abortTransaction();
      throw new Error(`Migration aborted: ${error.message}`);
    } finally {
      session.endSession();
    }
  },
  {
    connection: createRedisConnection(),
    concurrency: 2, // Low concurrency, DB-heavy
  }
);

lateConverterWorker.on('completed', (job) => {
  console.log(`[LateConverterWorker] Job complete (id: ${job.id})`);
});

lateConverterWorker.on('failed', (job, err) => {
  console.error(`[LateConverterWorker] Job failed (id: ${job?.id}): ${err.message}`);
});

export default lateConverterWorker;
