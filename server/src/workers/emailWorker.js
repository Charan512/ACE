import { Worker } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import sendEmail from '../utils/mailer.js';
import User from '../models/User.js';
import Registration from '../models/Registration.js';
import { buildWelcomeEmail, buildPaymentFailedEmail } from '../utils/emailTemplates.js';
import QRCode from 'qrcode';

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

      case 'guestQrEmail': {
        // Sent after a guest registers for an event (online or cash).
        // Generates a QR code encoding the registrationId and attaches it
        // to a confirmation email. EBMs/SBMs scan this QR at the event gate.
        const { registrationId, guestEmail, guestName, eventTitle, eventDate, venue, paymentMethod } = data;

        // Verify the registration still exists
        const reg = await Registration.findById(registrationId).select('_id status').lean();
        if (!reg) {
          throw new Error(`[EmailWorker] guestQrEmail: Registration ${registrationId} not found.`);
        }

        // Generate QR code as a PNG Buffer
        // The QR encodes the registrationId — the Ops checkIn endpoint accepts { registrationId }
        const qrBuffer = await QRCode.toBuffer(registrationId, {
          errorCorrectionLevel: 'H',
          type:   'png',
          width:  400,
          margin: 2,
          color: { dark: '#0B0F19', light: '#FFFFFF' },
        });

        const qrBase64 = qrBuffer.toString('base64');
        const dateStr   = eventDate ? new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
        const payBadge  = paymentMethod === 'cash' ? '💵 Cash' : '💳 Online';

        await sendEmail({
          to: guestEmail,
          subject: `Your Entry Pass — ${eventTitle}`,
          html: `
            <div style="font-family:sans-serif;background:#0B0F19;padding:32px;color:#f1f5f9;">
              <div style="max-width:520px;margin:0 auto;background:#111827;border:1px solid #1e293b;
                          border-radius:6px;padding:32px;">
                <h2 style="color:#00d4ff;font-family:monospace;margin:0 0 4px;">ACE — Entry Pass</h2>
                <p style="color:#64748b;font-size:13px;margin:0 0 24px;">Association of Computer Engineers</p>

                <p style="color:#cbd5e1;margin:0 0 8px;">Hello <strong>${guestName}</strong>,</p>
                <p style="color:#94a3b8;margin:0 0 24px;">
                  You are registered for <strong style="color:#f1f5f9;">${eventTitle}</strong>.
                  Show the QR code below at the event gate for entry.
                </p>

                <table style="width:100%;margin:0 0 24px;">
                  <tr>
                    <td style="color:#64748b;font-size:13px;padding:4px 0;">Event</td>
                    <td style="color:#f1f5f9;font-size:13px;text-align:right;">${eventTitle}</td>
                  </tr>
                  ${dateStr ? `<tr><td style="color:#64748b;font-size:13px;padding:4px 0;">Date</td><td style="color:#f1f5f9;font-size:13px;text-align:right;">${dateStr}</td></tr>` : ''}
                  ${venue ? `<tr><td style="color:#64748b;font-size:13px;padding:4px 0;">Venue</td><td style="color:#f1f5f9;font-size:13px;text-align:right;">${venue}</td></tr>` : ''}
                  <tr><td style="color:#64748b;font-size:13px;padding:4px 0;">Payment</td><td style="color:#f1f5f9;font-size:13px;text-align:right;">${payBadge}</td></tr>
                </table>

                <div style="text-align:center;background:#020617;padding:20px;
                            border:1px solid #1e293b;border-radius:4px;margin:0 0 24px;">
                  <img src="data:image/png;base64,${qrBase64}"
                       alt="Entry QR Code"
                       style="width:220px;height:220px;display:block;margin:0 auto 12px;"/>
                  <p style="color:#475569;font-size:11px;margin:0;font-family:monospace;">ID: ${registrationId}</p>
                </div>

                <p style="color:#475569;font-size:12px;margin:0;">
                  This QR is unique to you. Do not share it. Present it at the venue entrance.
                </p>
              </div>
            </div>
          `,
        });
        console.log(`[EmailWorker] Guest QR entry pass emailed to ${guestEmail} (reg: ${registrationId})`);
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
  console.log(`[EmailWorker] Job completed: ${job.name} (id: ${job.id})`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job failed: ${job?.name} (id: ${job?.id}) — ${err.message}`);
});

export default emailWorker;
