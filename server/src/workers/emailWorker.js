import { Worker } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import sendEmail from '../utils/mailer.js';
import User from '../models/User.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import AppSettings from '../models/AppSettings.js';
import {
  buildWelcomeEmail,
  buildPaymentFailedEmail,
  renderAdminTemplate,
} from '../utils/emailTemplates.js';
import renderCertificate from '../utils/certRenderer.js';
import QRCode from 'qrcode';

/**
 * Email Worker — processes jobs from the ace-email queue.
 *
 * Supported job names:
 *   welcomeEmail                     → new member's credentials email (temp password)
 *   membershipConfirmationEmail      → admin-configured body + membership cert PNG attachment
 *   paymentFailedEmail               → payment failure notification
 *   otpEmail                         → OTP for password reset
 *   guestQrEmail                     → guest event registration — QR attachment to admin-configured body
 *   eventRegistrationConfirmationEmail → member event registration — admin-configured body
 *   postEventCertificateEmail        → certificate PNG attachment to admin-configured body (all registrants)
 *
 * ZERO-STORAGE: All PNG buffers (certificates, QR codes) are generated in RAM
 * and attached directly to the email. Nothing is written to disk or uploaded to R2.
 */
const emailWorker = new Worker(
  'ace-email',
  async (job) => {
    const { name, data } = job;
    console.log(`[EmailWorker] Processing job: ${name} (id: ${job.id})`);

    switch (name) {

      // ── Credentials email for new members ────────────────────
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

      // ── Membership confirmation — admin-configured body + certificate PNG ──
      case 'membershipConfirmationEmail': {
        const { userId, aceId, feePaid } = data;

        const user = await User.findById(userId).select('name email').lean();
        if (!user) {
          throw new Error(`[EmailWorker] membershipConfirmationEmail: User ${userId} not found.`);
        }

        const settings = await AppSettings.getSingleton();
        const template = settings.membershipConfirmationEmailTemplate;

        const vars = {
          name:     user.name,
          email:    user.email,
          ace_id:   aceId,
          fee_paid: feePaid ?? settings.membershipFee,
        };

        const subject = renderAdminTemplate(template?.subject || 'Welcome to ACE — {{name}}', vars);
        const body    = renderAdminTemplate(
          template?.body || '<p>Dear {{name}}, your ACE Membership is confirmed. Your ID is <strong>{{ace_id}}</strong>.</p>',
          vars
        );

        const attachments = [];

        // Render membership certificate if template is configured
        if (settings.membershipCertificateTemplate?.baseImageUrl) {
          try {
            const memberSince = new Date().toLocaleDateString('en-IN', {
              day: '2-digit', month: 'long', year: 'numeric',
            });

            const certBuffer = await renderCertificate({
              baseImageUrl: settings.membershipCertificateTemplate.baseImageUrl,
              textFields:   settings.membershipCertificateTemplate.textFields,
              data: {
                recipientName: user.name,
                aceId,
                memberSince,
              },
            });

            const safeName = user.name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
            attachments.push({
              filename:    `ACE_Membership_Certificate_${safeName}.png`,
              content:     certBuffer,
              contentType: 'image/png',
            });
            console.log(`[EmailWorker] Membership certificate rendered for ${user.email}`);
          } catch (certErr) {
            // Non-fatal: send email without cert if rendering fails
            console.error(`[EmailWorker] membershipConfirmationEmail cert render failed: ${certErr.message}`);
          }
        }

        await sendEmail({
          to:          user.email,
          subject,
          html:        template?.isHtml === false ? `<pre>${body}</pre>` : body,
          attachments,
        });
        console.log(`[EmailWorker] Membership confirmation email sent to ${user.email} (${aceId})`);
        break;
      }

      // ── Payment failure notification ─────────────────────────
      case 'paymentFailedEmail': {
        const { email, name: recipientName, eventTitle } = data;

        const { subject, html } = buildPaymentFailedEmail({
          name:       recipientName || 'Member',
          eventTitle: eventTitle || 'the event',
        });

        await sendEmail({ to: email, subject, html });
        console.log(`[EmailWorker] Payment failed email sent to ${email}`);
        break;
      }

      // ── OTP for password reset ───────────────────────────────
      case 'otpEmail': {
        const { email, otp } = data;

        await sendEmail({
          to:      email,
          subject: 'ACE ERP — Your OTP for Password Reset',
          html: `
            <div style="font-family:sans-serif;background:#0B0F19;padding:32px;color:#f1f5f9;">
              <div style="max-width:480px;margin:0 auto;background:#111827;border:1px solid #1e293b;border-radius:4px;padding:32px;">
                <p style="color:#94a3b8;margin:0 0 16px;">Your ACE ERP password reset OTP:</p>
                <code style="display:block;background:#020617;border:1px solid #1e293b;padding:14px 20px;
                  font-size:28px;letter-spacing:0.3em;color:#00d4ff;font-family:monospace;text-align:center;
                  border-radius:2px;margin:0 0 16px;">${otp}</code>
                <p style="color:#475569;font-size:13px;margin:0;">
                  This OTP expires in ${process.env.OTP_EXPIRY_MINUTES} minutes.
                  Do not share this with anyone.
                </p>
              </div>
            </div>
          `,
        });
        console.log(`[EmailWorker] OTP email sent to ${email}`);
        break;
      }

      // ── Guest event registration — admin body + QR attachment ──
      // Sent after a guest registers for an event (online or cash).
      case 'guestQrEmail': {
        const { registrationId, guestEmail, guestName, eventTitle, eventDate, venue, paymentMethod, eventId } = data;

        const reg = await Registration.findById(registrationId).select('_id status').lean();
        if (!reg) {
          throw new Error(`[EmailWorker] guestQrEmail: Registration ${registrationId} not found.`);
        }

        // Generate QR PNG buffer
        const qrBuffer = await QRCode.toBuffer(registrationId, {
          errorCorrectionLevel: 'H',
          type:   'png',
          width:  400,
          margin: 2,
          color: { dark: '#0B0F19', light: '#FFFFFF' },
        });

        const dateStr  = eventDate ? new Date(eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
        const payBadge = paymentMethod === 'cash' ? '💵 Cash' : '💳 Online';

        // Check for admin-configured email body
        let subject, htmlBody;
        if (eventId) {
          const event = await Event.findById(eventId).select('registrationConfirmationEmail title').lean();
          const tpl   = event?.registrationConfirmationEmail;
          if (tpl?.subject && tpl?.body) {
            const vars = { name: guestName, event_name: eventTitle, event_date: dateStr };
            subject  = renderAdminTemplate(tpl.subject, vars);
            htmlBody = tpl.isHtml === false
              ? `<pre style="font-family:sans-serif;">${renderAdminTemplate(tpl.body, vars)}</pre>`
              : renderAdminTemplate(tpl.body, vars);
          }
        }

        // Fallback to default body if admin hasn't configured one
        if (!subject || !htmlBody) {
          subject  = `Your Entry Pass — ${eventTitle}`;
          htmlBody = buildDefaultGuestQrEmailHtml({ guestName, eventTitle, dateStr, venue, payBadge, registrationId });
        }

        await sendEmail({
          to:      guestEmail,
          subject,
          html:    htmlBody,
          attachments: [
            {
              filename:    `ACE_EntryPass_${registrationId}.png`,
              content:     qrBuffer,
              contentType: 'image/png',
            },
          ],
        });
        console.log(`[EmailWorker] Guest QR entry pass emailed to ${guestEmail} (reg: ${registrationId})`);
        break;
      }

      // ── Member event registration confirmation (no QR needed) ──
      case 'eventRegistrationConfirmationEmail': {
        const { userId, eventId, registrationId } = data;

        const [user, event] = await Promise.all([
          User.findById(userId).select('name email').lean(),
          Event.findById(eventId).select('title eventDate registrationConfirmationEmail').lean(),
        ]);

        if (!user || !event) {
          throw new Error(`[EmailWorker] eventRegistrationConfirmationEmail: User or Event not found.`);
        }

        const dateStr = new Date(event.eventDate).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
        });

        const tpl = event.registrationConfirmationEmail;
        let subject, htmlBody;

        if (tpl?.subject && tpl?.body) {
          const vars = { name: user.name, event_name: event.title, event_date: dateStr };
          subject  = renderAdminTemplate(tpl.subject, vars);
          htmlBody = tpl.isHtml === false
            ? `<pre style="font-family:sans-serif;">${renderAdminTemplate(tpl.body, vars)}</pre>`
            : renderAdminTemplate(tpl.body, vars);
        } else {
          // Fallback: use QR entry pass style email for members too
          subject  = `Registration Confirmed — ${event.title}`;
          htmlBody = buildDefaultMemberConfirmHtml({ name: user.name, eventTitle: event.title, dateStr });
        }

        await sendEmail({ to: user.email, subject, html: htmlBody });
        console.log(`[EmailWorker] Event registration confirmation sent to ${user.email} (event: ${event.title})`);
        break;
      }

      // ── Post-event certificate email — cert PNG + admin body ──
      // Sent to a single registrant (called in batch from certificateWorker).
      case 'postEventCertificateEmail': {
        const { recipientName, recipientEmail, eventId, certBuffer: certBufferBase64, resources = [] } = data;

        const event = await Event.findById(eventId).select('title eventDate postEventCertificateEmail').lean();
        if (!event) {
          throw new Error(`[EmailWorker] postEventCertificateEmail: Event ${eventId} not found.`);
        }

        const dateStr = new Date(event.eventDate).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
        });

        const tpl = event.postEventCertificateEmail;
        let subject, htmlBody;

        // Build the resources HTML block (appended to both custom and fallback emails)
        const resourcesHtml = resources.length > 0
          ? `
            <div style="margin-top:28px;padding-top:20px;border-top:1px solid #1e293b;">
              <p style="color:#64748b;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 12px;font-weight:600;">EVENT RESOURCES</p>
              <ul style="list-style:none;padding:0;margin:0;">
                ${resources.map(r => `
                  <li style="margin-bottom:10px;">
                    <a href="${r.url}" target="_blank" rel="noopener noreferrer"
                       style="display:inline-flex;align-items:center;gap:8px;background:#0f172a;
                              border:1px solid #1e3a5f;border-radius:6px;padding:8px 14px;
                              color:#38bdf8;font-size:13px;text-decoration:none;font-weight:500;">
                      &#8599;&nbsp;${r.name}
                    </a>
                  </li>`).join('')}
              </ul>
            </div>`
          : '';

        if (tpl?.subject && tpl?.body) {
          const vars = { name: recipientName, event_name: event.title, event_date: dateStr };
          subject  = renderAdminTemplate(tpl.subject, vars);
          const renderedBody = tpl.isHtml === false
            ? `<pre style="font-family:sans-serif;">${renderAdminTemplate(tpl.body, vars)}</pre>`
            : renderAdminTemplate(tpl.body, vars);
          htmlBody = renderedBody + resourcesHtml;
        } else {
          subject  = `Your Certificate — ${event.title} | ACE`;
          htmlBody = buildDefaultCertEmailHtml({ name: recipientName, eventTitle: event.title, eventDate: dateStr, resourcesHtml });
        }

        // certBuffer is passed as base64 string (BullMQ serialises via JSON)
        const certBuffer = Buffer.from(certBufferBase64, 'base64');
        const safeName   = recipientName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
        const safeTitle  = event.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);

        await sendEmail({
          to:      recipientEmail,
          subject,
          html:    htmlBody,
          attachments: [
            {
              filename:    `ACE_Certificate_${safeName}_${safeTitle}.png`,
              content:     certBuffer,
              contentType: 'image/png',
            },
          ],
        });
        console.log(`[EmailWorker] Certificate email sent to ${recipientEmail}`);
        break;
      }

      default:
        console.warn(`[EmailWorker] Unknown job name: ${name}. Skipping.`);
    }
  },
  {
    connection: createRedisConnection(),
    concurrency: 5,
  }
);

emailWorker.on('completed', (job) => {
  console.log(`[EmailWorker] Job completed: ${job.name} (id: ${job.id})`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job failed: ${job?.name} (id: ${job?.id}) — ${err.message}`);
});

export default emailWorker;

// ─────────────────────────────────────────────────────────────
// FALLBACK EMAIL HTML BUILDERS (used when admin hasn't configured a template)
// ─────────────────────────────────────────────────────────────

function buildDefaultGuestQrEmailHtml({ guestName, eventTitle, dateStr, venue, payBadge, registrationId }) {
  return `
    <div style="font-family:sans-serif;background:#0B0F19;padding:32px;color:#f1f5f9;">
      <div style="max-width:520px;margin:0 auto;background:#111827;border:1px solid #1e293b;
                  border-radius:6px;padding:32px;">
        <h2 style="color:#00d4ff;font-family:monospace;margin:0 0 4px;">ACE — Entry Pass</h2>
        <p style="color:#64748b;font-size:13px;margin:0 0 24px;">Association of Computer Engineers</p>
        <p style="color:#cbd5e1;margin:0 0 8px;">Hello <strong>${guestName}</strong>,</p>
        <p style="color:#94a3b8;margin:0 0 24px;">
          You are registered for <strong style="color:#f1f5f9;">${eventTitle}</strong>.
          Your QR entry pass is attached to this email. Present it at the venue gate.
        </p>
        <table style="width:100%;margin:0 0 24px;">
          <tr><td style="color:#64748b;font-size:13px;padding:4px 0;">Event</td><td style="color:#f1f5f9;font-size:13px;text-align:right;">${eventTitle}</td></tr>
          ${dateStr ? `<tr><td style="color:#64748b;font-size:13px;padding:4px 0;">Date</td><td style="color:#f1f5f9;font-size:13px;text-align:right;">${dateStr}</td></tr>` : ''}
          ${venue ? `<tr><td style="color:#64748b;font-size:13px;padding:4px 0;">Venue</td><td style="color:#f1f5f9;font-size:13px;text-align:right;">${venue}</td></tr>` : ''}
          <tr><td style="color:#64748b;font-size:13px;padding:4px 0;">Payment</td><td style="color:#f1f5f9;font-size:13px;text-align:right;">${payBadge}</td></tr>
        </table>
        <p style="color:#475569;font-size:12px;margin:0;">This QR is unique to you. ID: ${registrationId}</p>
      </div>
    </div>
  `;
}

function buildDefaultMemberConfirmHtml({ name, eventTitle, dateStr }) {
  return `
    <div style="font-family:sans-serif;background:#0B0F19;padding:32px;color:#f1f5f9;">
      <div style="max-width:520px;margin:0 auto;background:#111827;border:1px solid #1e293b;border-radius:6px;padding:32px;">
        <h2 style="color:#00d4ff;margin:0 0 4px;">Registration Confirmed</h2>
        <p style="color:#64748b;font-size:13px;margin:0 0 24px;">Association of Computer Engineers</p>
        <p style="color:#cbd5e1;">Hello <strong>${name}</strong>,</p>
        <p style="color:#94a3b8;">
          Your registration for <strong style="color:#f1f5f9;">${eventTitle}</strong> on
          <strong style="color:#f1f5f9;">${dateStr}</strong> is confirmed.
        </p>
        <p style="color:#475569;font-size:12px;">Show your ACE ID card at the venue for entry.</p>
      </div>
    </div>
  `;
}

function buildDefaultCertEmailHtml({ name, eventTitle, eventDate, resourcesHtml = '' }) {
  return `
    <div style="font-family:sans-serif;background:#0B0F19;padding:32px;color:#f1f5f9;">
      <div style="max-width:600px;margin:32px auto;background:#111827;border:1px solid #1e293b;border-radius:4px;overflow:hidden;">
        <div style="background:#020617;border-bottom:2px solid #00d4ff;padding:24px 32px;">
          <p style="color:#00d4ff;font-size:11px;letter-spacing:0.15em;margin:0 0 8px;text-transform:uppercase;">ASSOCIATION OF COMPUTER ENGINEERS</p>
          <h1 style="color:#f1f5f9;font-size:22px;margin:0;">Your Certificate of Participation</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#94a3b8;margin:0 0 16px;">Hi <strong style="color:#f1f5f9;">${name}</strong>,</p>
          <p style="color:#94a3b8;margin:0 0 24px;">
            Thank you for participating in <strong style="color:#f1f5f9;">${eventTitle}</strong>
            on <strong style="color:#f1f5f9;">${eventDate}</strong>.
            Your personalized certificate is attached to this email.
          </p>
          <p style="color:#475569;font-size:13px;margin:0;">Please save it for your records.</p>
          ${resourcesHtml}
        </div>
        <div style="padding:16px 32px;border-top:1px solid #1e293b;font-size:12px;color:#475569;text-align:center;">
          This is an automated message from ACE ERP. Do not reply to this email.
        </div>
      </div>
    </div>
  `;
}
