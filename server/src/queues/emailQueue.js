import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';

/**
 * Email Queue — general-purpose async email delivery.
 *
 * Job names (job.name):
 *   'welcomeEmail'       → new member account created after payment
 *   'paymentFailedEmail' → payment failure notification
 *   'otpEmail'           → OTP for password reset
 *
 * Each job's data shape:
 *   welcomeEmail:       { userId, aceId, tempPassword }
 *   paymentFailedEmail: { email, name, eventTitle }
 *   otpEmail:           { email, otp }
 *
 * NEVER use setTimeout/setInterval for email delivery.
 */
const emailQueue = new Queue('ace-email', {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,               // Retry up to 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 5000,             // 5s → 10s → 20s backoff
    },
    removeOnComplete: { count: 100 }, // Keep last 100 completed jobs for inspection
    removeOnFail: { count: 200 },     // Keep last 200 failed jobs for debugging
  },
});

export default emailQueue;
