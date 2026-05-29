import { Worker } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import sendEmail from '../utils/mailer.js';
import User from '../models/User.js';
import { buildWelcomeEmail, buildPaymentFailedEmail } from '../utils/emailTemplates.js';

/**
 * Email Worker — processes jobs from the ace-email queue.
 *
 * Supported job names:
 *   welcomeEmail       → new member's credentials email
 *   paymentFailedEmail → payment failure notification
 *   otpEmail           → OTP for password reset (implemented with auth routes)
 *
 * This worker must run in its own process (see workers/index.js).
 * NEVER instantiate workers inside the main Express server process.
 */
const emailWorker = new Worker(
  'ace-email',
  async (job) => {
    const { name, data } = job;
    console.log(`[EmailWorker] Processing job: ${name} (id: ${job.id})`);

    switch (name) {
      case 'welcomeEmail': {
        const { userId, aceId, tempPassword } = data;

        const user = await User.findById(userId).select('name email').lean();
        if (!user) {
          throw new Error(`[EmailWorker] welcomeEmail: User ${userId} not found.`);
        }

        const { subject, html } = buildWelcomeEmail({
          name: user.name,
          aceId,
          tempPassword,
        });

        await sendEmail({ to: user.email, subject, html });
        console.log(`[EmailWorker] Welcome email sent to ${user.email} (${aceId})`);
        break;
      }

      case 'paymentFailedEmail': {
        const { email, name: recipientName, eventTitle } = data;

        const { subject, html } = buildPaymentFailedEmail({
          name: recipientName || 'Member',
          eventTitle: eventTitle || 'the event',
        });

        await sendEmail({ to: email, subject, html });
        console.log(`[EmailWorker] Payment failed email sent to ${email}`);
        break;
      }

      case 'otpEmail': {
        const { email, otp } = data;

        await sendEmail({
          to: email,
          subject: 'ACE ERP — Your OTP for Password Reset',
          html: `
            <div style="font-family:sans-serif;background:#0B0F19;padding:32px;color:#f1f5f9;">
              <div style="max-width:480px;margin:0 auto;background:#111827;border:1px solid #1e293b;border-radius:4px;padding:32px;">
                <p style="color:#94a3b8;margin:0 0 16px;">Your ACE ERP password reset OTP:</p>
                <code style="display:block;background:#020617;border:1px solid #1e293b;padding:14px 20px;
                  font-size:28px;letter-spacing:0.3em;color:#00d4ff;font-family:monospace;text-align:center;
                  border-radius:2px;margin:0 0 16px;">${otp}</code>
                <p style="color:#475569;font-size:13px;margin:0;">
                  This OTP expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.
                  Do not share this with anyone.
                </p>
              </div>
            </div>
          `,
        });
        console.log(`[EmailWorker] OTP email sent to ${email}`);
        break;
      }

      default:
        console.warn(`[EmailWorker] Unknown job name: ${name}. Skipping.`);
    }
  },
  {
    connection: createRedisConnection(),
    concurrency: 5, // Process up to 5 email jobs in parallel
  }
);

emailWorker.on('completed', (job) => {
  console.log(`[EmailWorker] ✅ Job completed: ${job.name} (id: ${job.id})`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[EmailWorker] ❌ Job failed: ${job?.name} (id: ${job?.id}) — ${err.message}`);
});

export default emailWorker;
