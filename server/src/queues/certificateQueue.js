import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';

/**
 * Certificate Release Queue — triggers guest certificate email delivery.
 *
 * Job names:
 *   'releaseCertificates' → batch-emit personalized PNG certificates
 *                           to all guest registrants of an event via email.
 *
 * Job data shape:
 *   releaseCertificates: { eventId: string }
 *
 * Design notes:
 *   - Members do NOT receive an email. They self-serve via GET /api/certificates/download/:eventId
 *     from their dashboard once certificatesReleased = true.
 *   - Guests have no login credentials, so email is the ONLY delivery mechanism for them.
 *   - The worker renders each guest's certificate in-memory using @napi-rs/canvas,
 *     then attaches the PNG buffer to a Nodemailer/Resend email. Zero disk writes.
 *
 * NEVER use setTimeout/setInterval for this. BullMQ + Redis handles retry/backoff.
 */
const certificateQueue = new Queue('ace-certificates', {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,                         // Retry up to 3 times on transient failures
    backoff: {
      type: 'exponential',
      delay: 10000,                      // 10s → 20s → 40s backoff
    },
    removeOnComplete: { count: 50 },
    removeOnFail:    { count: 100 },
  },
});

export default certificateQueue;
