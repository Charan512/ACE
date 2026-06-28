import { Worker } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import sendEmail from '../utils/mailer.js';
import renderCertificate from '../utils/certRenderer.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';

/**
 * Certificate Worker — processes jobs from the ace-certificates queue.
 *
 * Job: 'releaseCertificates'
 *   data: { eventId: string }
 *
 * Strategy:
 *   1. Fetch the event (needs template + title + eventDate)
 *   2. Find all confirmed registrations for the event that have a guestEmail
 *      (members self-serve from their dashboard — they are NOT emailed)
 *   3. For each guest registration, render a personalized certificate PNG in memory
 *   4. Attach the buffer to a Resend email and send
 *   5. Failures on individual guests are logged but do NOT abort the whole batch —
 *      the job only throws if the event itself cannot be loaded.
 *
 * Zero-storage guarantee: PNG buffers exist only in RAM per iteration.
 *   The buffer goes out of scope (and is GC'd) after sendMail() resolves.
 */
const certificateWorker = new Worker(
  'ace-certificates',
  async (job) => {
    const { name, data } = job;
    console.log(`[CertWorker] Processing job: ${name} (id: ${job.id})`);

    if (name !== 'releaseCertificates') {
      console.warn(`[CertWorker] Unknown job name: ${name}. Skipping.`);
      return;
    }

    const { eventId } = data;

    // ── 1. Load event with certificate template ────────────────
    const event = await Event.findById(eventId).lean();

    if (!event) {
      throw new Error(`[CertWorker] Event ${eventId} not found. Aborting job.`);
    }
    if (!event.certificateTemplate?.baseImageUrl) {
      throw new Error(`[CertWorker] Event ${eventId} has no certificate template. Aborting job.`);
    }

    const { baseImageUrl, textFields } = event.certificateTemplate;

    // Format date once — shared across all guest certificates for this event
    const eventDate = new Date(event.eventDate).toLocaleDateString('en-GB', {
      day:   '2-digit',
      month: 'short',
      year:  'numeric',
    });

    // ── 2. Find all guest registrations (guestEmail is not null) ─
    // Members are excluded: they have userId set but guestEmail null.
    // We ONLY email guests who cannot log in to download their own certificate.
    const guestRegistrations = await Registration.find({
      eventId,
      status:     'confirmed',
      guestEmail: { $ne: null },
    })
      .select('guestName guestEmail')
      .lean();

    console.log(
      `[CertWorker] Event "${event.title}" — ${guestRegistrations.length} guest certificate(s) to send.`
    );

    if (guestRegistrations.length === 0) {
      console.log(`[CertWorker] No guest registrations found. Job complete.`);
      return;
    }

    // ── 3 + 4. Render + email each guest certificate ───────────
    // We process sequentially (not Promise.all) to avoid OOM from simultaneous canvas renders.
    let successCount = 0;
    let failCount    = 0;

    for (const reg of guestRegistrations) {
      try {
        const recipientName = reg.guestName || 'Participant';

        // Render personalized certificate in RAM — zero disk writes
        const pngBuffer = await renderCertificate({
          baseImageUrl,
          textFields,
          data: {
            recipientName,
            aceId:      'GUEST',   // Guests do not have aceId
            eventTitle: event.title,
            eventDate,
          },
        });

        // Build a safe filename for the attachment
        const safeTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
        const safeName  = recipientName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
        const filename  = `ACE_Certificate_${safeName}_${safeTitle}.png`;

        // Send via Resend SMTP relay — PNG buffer attached inline
        await sendEmail({
          to:      reg.guestEmail,
          subject: `Your Certificate — ${event.title} | ACE`,
          html:    buildCertificateEmail({ name: recipientName, eventTitle: event.title, eventDate }),
          attachments: [
            {
              filename,
              content:     pngBuffer,
              contentType: 'image/png',
            },
          ],
        });

        console.log(`[CertWorker] ✓ Certificate sent to ${reg.guestEmail}`);
        successCount++;
      } catch (err) {
        // Log the individual failure but continue with the rest of the batch.
        // A single broken canvas render / failed email should not block everyone else.
        console.error(`[CertWorker] ✗ Failed for ${reg.guestEmail}: ${err.message}`);
        failCount++;
      }
    }

    console.log(
      `[CertWorker] Batch complete for event "${event.title}" — ` +
      `${successCount} sent, ${failCount} failed.`
    );
  },
  {
    connection: createRedisConnection(),
    concurrency: 1, // Serial processing — canvas renders are CPU/memory intensive
  }
);

// ── Event listeners ────────────────────────────────────────────

certificateWorker.on('completed', (job) => {
  console.log(`[CertWorker] Job completed: ${job.name} (id: ${job.id})`);
});

certificateWorker.on('failed', (job, err) => {
  console.error(
    `[CertWorker] Job failed: ${job?.name} (id: ${job?.id}) — ${err.message}`
  );
});

export default certificateWorker;

// ─────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Builds the HTML email body for a guest certificate delivery.
 * The certificate PNG is attached as a file, not embedded inline.
 *
 * @param {Object} params
 * @param {string} params.name        - Guest's name
 * @param {string} params.eventTitle  - Event title
 * @param {string} params.eventDate   - Formatted event date
 * @returns {string} HTML string
 */
function buildCertificateEmail({ name, eventTitle, eventDate }) {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background-color:#0B0F19;color:#f1f5f9;margin:0;padding:0;">
      <div style="max-width:600px;margin:32px auto;background:#111827;border:1px solid #1e293b;border-radius:4px;overflow:hidden;">

        <div style="background:#020617;border-bottom:2px solid #00d4ff;padding:24px 32px;">
          <p style="color:#00d4ff;font-size:11px;letter-spacing:0.15em;margin:0 0 8px;text-transform:uppercase;">
            ASSOCIATION OF COMPUTER ENGINEERS
          </p>
          <h1 style="color:#f1f5f9;font-size:22px;margin:0;">Your Certificate of Participation</h1>
        </div>

        <div style="padding:32px;">
          <p style="color:#94a3b8;margin:0 0 16px;">
            Hi <strong style="color:#f1f5f9;">${name}</strong>,
          </p>
          <p style="color:#94a3b8;margin:0 0 24px;">
            Thank you for participating in <strong style="color:#f1f5f9;">${eventTitle}</strong>
            on <strong style="color:#f1f5f9;">${eventDate}</strong>.
            Your personalized certificate of participation is attached to this email.
          </p>
          <p style="color:#475569;font-size:13px;margin:0;">
            This certificate was generated specifically for you. Please save it for your records.
          </p>
        </div>

        <div style="padding:16px 32px;border-top:1px solid #1e293b;font-size:12px;color:#475569;text-align:center;">
          This is an automated message from ACE ERP. Do not reply to this email.
        </div>

      </div>
    </div>
  `;
}
