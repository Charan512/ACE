import { Worker } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import renderCertificate from '../utils/certRenderer.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { emailQueue } from '../queues/index.js';

/**
 * Certificate Worker — processes jobs from the ace-certificates queue.
 *
 * Job: 'releaseCertificates'
 *   data: { eventId: string }
 *
 * Strategy:
 *   1. Fetch the event (needs template + title + eventDate + postEventCertificateEmail)
 *   2. Find ALL confirmed registrations (members + guests)
 *      - Members: access certificate via their dashboard AND receive email
 *      - Guests: no portal login — email is their only channel
 *   3. For each registrant, render a personalized certificate PNG in memory
 *   4. Enqueue a postEventCertificateEmail job in the email queue (passing the cert as base64)
 *      → The emailWorker handles the admin-configured body template + attachment
 *   5. Failures on individual registrants are logged but do NOT abort the whole batch.
 *
 * ZERO-STORAGE GUARANTEE:
 *   PNG buffers exist only in RAM per iteration, serialised to base64 for BullMQ transport.
 *   The buffer goes out of scope (GC'd) after the email job is enqueued.
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
    const event = await Event.findById(eventId).select('title eventDate certificateTemplate resources').lean();

    if (!event) {
      throw new Error(`[CertWorker] Event ${eventId} not found. Aborting job.`);
    }
    if (!event.certificateTemplate?.baseImageUrl) {
      throw new Error(`[CertWorker] Event ${eventId} has no certificate template. Aborting job.`);
    }

    const { baseImageUrl, textFields } = event.certificateTemplate;

    // Format date once — shared across all certificates for this event
    const eventDate = new Date(event.eventDate).toLocaleDateString('en-GB', {
      day:   '2-digit',
      month: 'short',
      year:  'numeric',
    });

    // ── 2. Find ALL confirmed registrations (members + guests) ─
    // Members are also emailed their certificate as a convenience
    // (they can also self-serve download from dashboard after certificatesReleased=true)
    const registrations = await Registration.find({
      eventId,
      status: 'confirmed',
    })
      .populate('userId', 'name email aceId')
      .select('guestName guestEmail userId tier')
      .lean();

    console.log(
      `[CertWorker] Event "${event.title}" — ${registrations.length} certificate(s) to send.`
    );

    if (registrations.length === 0) {
      console.log(`[CertWorker] No confirmed registrations found. Job complete.`);
      return;
    }

    // ── 3 + 4. Render + enqueue email for each registrant ──────
    // Sequential processing — canvas renders are CPU/memory intensive.
    let successCount = 0;
    let failCount    = 0;

    for (const reg of registrations) {
      try {
        const isGuest       = !reg.userId;
        const recipientName = isGuest ? (reg.guestName || 'Participant') : reg.userId.name;
        const recipientEmail = isGuest ? reg.guestEmail : reg.userId.email;
        const aceId         = isGuest ? 'GUEST' : (reg.userId.aceId || 'GUEST');

        if (!recipientEmail) {
          console.warn(`[CertWorker] No email for registration ${reg._id}. Skipping.`);
          continue;
        }

        // Render personalized certificate PNG in RAM
        const pngBuffer = await renderCertificate({
          baseImageUrl,
          textFields,
          data: {
            recipientName,
            aceId,
            eventTitle: event.title,
            eventDate,
          },
        });

        // Pass cert as base64 string — BullMQ serialises job data as JSON (no Buffer support)
        await emailQueue.add('postEventCertificateEmail', {
          recipientName,
          recipientEmail,
          eventId,
          certBuffer: pngBuffer.toString('base64'),
          resources:  event.resources || [],
        });

        console.log(`[CertWorker] ✓ Certificate email job enqueued for ${recipientEmail}`);
        successCount++;
      } catch (err) {
        // Log the individual failure but continue with the rest of the batch.
        console.error(`[CertWorker] ✗ Failed for registration ${reg._id}: ${err.message}`);
        failCount++;
      }
    }

    console.log(
      `[CertWorker] Batch complete for event "${event.title}" — ` +
      `${successCount} enqueued, ${failCount} failed.`
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
