import { Worker } from 'bullmq';
import redis, { createRedisConnection } from '../config/redis.js';
import mongoose from 'mongoose';
import AdminNotification from '../models/AdminNotification.js';
import User from '../models/User.js';
import { emailQueue } from '../queues/index.js';

/**
 * Treasurer Worker — Processes the debounced treasurer digest.
 *
 * Runs when the 'treasurer-digest' job fires (debounced by 2.5h, ceiling 10h).
 * Bundles all unnotified cash transactions and emails them to the Treasurer.
 */
const treasurerWorker = new Worker(
  'ace-treasurer',
  async (job) => {
    console.log(`[TreasurerWorker] Processing digest job (id: ${job.id})`);

    // 1. Find the Treasurer's email
    const treasurer = await User.findOne({ designation: 'Treasurer' }).select('email name');
    if (!treasurer || !treasurer.email) {
      console.warn(`[TreasurerWorker] No active Treasurer found. Skipping digest.`);
      return;
    }

    // 2. Start atomic session to gather and mark notifications as notified
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const notifications = await AdminNotification.find({
        type: 'cash_registration',
        isNotified: false,
      }).session(session).lean();

      if (notifications.length === 0) {
        console.log(`[TreasurerWorker] No new cash registrations to report. Skipping email.`);
        await session.commitTransaction();
        return;
      }

      // Mark as notified
      const notificationIds = notifications.map((n) => n._id);
      await AdminNotification.updateMany(
        { _id: { $in: notificationIds } },
        { $set: { isNotified: true } },
        { session }
      );

      await session.commitTransaction();

      // 3. Generate HTML table for email
      let totalAmount = 0;
      const rows = notifications.map(n => {
        totalAmount += n.amount;
        return `
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc;">${new Date(n.createdAt).toLocaleString()}</td>
            <td style="padding: 8px; border: 1px solid #ccc;">${n.registrant.name}</td>
            <td style="padding: 8px; border: 1px solid #ccc;">${n.eventTitle || 'Membership'}</td>
            <td style="padding: 8px; border: 1px solid #ccc;">${n.registeredByName}</td>
            <td style="padding: 8px; border: 1px solid #ccc;">₹${n.amount}</td>
          </tr>
        `;
      }).join('');

      const htmlBody = `
        <div style="font-family: sans-serif; color: #333;">
          <h2 style="color: #0B0F19;">ACE Treasurer Digest</h2>
          <p>Hello ${treasurer.name},</p>
          <p>Here is the latest summary of cash registrations collected by the SBMs/EBMs:</p>
          
          <table style="border-collapse: collapse; width: 100%; margin-top: 15px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Date/Time</th>
                <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Registrant</th>
                <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Event</th>
                <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Collected By</th>
                <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
            <tfoot>
              <tr>
                <th colspan="4" style="padding: 8px; border: 1px solid #ccc; text-align: right;"><strong>Total Collected:</strong></th>
                <th style="padding: 8px; border: 1px solid #ccc; text-align: left;"><strong>₹${totalAmount}</strong></th>
              </tr>
            </tfoot>
          </table>
          <p style="margin-top: 20px;"><em>This is an automated report from the ACE ERP.</em></p>
        </div>
      `;

      // 4. Enqueue the email job
      await emailQueue.add('sendRawEmail', {
        to: treasurer.email,
        subject: `ACE Treasurer Digest — ₹${totalAmount} Collected`,
        html: htmlBody,
      });

      console.log(`[TreasurerWorker] Sent digest to Treasurer (${treasurer.email}) for ${notifications.length} transactions.`);
      
      // Clear the Redis trigger time
      await redis.del('treasurer_digest_first_trigger');

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },
  {
    connection: createRedisConnection(),
    concurrency: 1, // Ensure strict serial processing
  }
);

treasurerWorker.on('completed', (job) => {
  console.log(`[TreasurerWorker] Job complete (id: ${job.id})`);
});

treasurerWorker.on('failed', (job, err) => {
  console.error(`[TreasurerWorker] Job failed (id: ${job?.id}): ${err.message}`);
});

export default treasurerWorker;
