import Event from '../models/Event.js';
import User from '../models/User.js';
import renderCertificate from '../utils/certRenderer.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Formats an event date as "DD MMM YYYY" (e.g., "15 Aug 2026").
 * Used as a variable in certificate text fields.
 *
 * @param {Date} date
 * @returns {string}
 */
const formatEventDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// ─────────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/certificates/download/:eventId
 *
 * Streams a personalized, high-res PNG certificate directly to the client.
 *
 * Flow:
 *  1. Validate the event exists and has a certificate template
 *  2. Verify the requesting user attended this event (from their Member Vault)
 *  3. Build the data map (name, aceId, eventTitle, eventDate)
 *  4. Call renderCertificate() → in-memory PNG buffer
 *  5. Set Content-Disposition: attachment header and pipe the buffer
 *  6. Buffer is garbage-collected immediately — zero persistent storage
 *
 * Security: requires protect + requirePasswordChange middleware (see routes).
 */
export const downloadCertificate = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;
  const requestingUser = req.user;

  // ── 1. Fetch and validate the event ───────────────────────
  const event = await Event.findById(eventId).lean();
  if (!event) {
    return next(new AppError('Event not found.', 404));
  }
  if (!event.certificateTemplate || !event.certificateTemplate.baseImageUrl) {
    return next(new AppError('This event does not have a certificate template configured.', 404));
  }
  if (!event.certificateTemplate.textFields?.length) {
    return next(new AppError('Certificate template has no text fields defined.', 500));
  }

  // ── 2. Verify the user attended this event ─────────────────
  // We check the user's Member Vault — populated in Phase 3 when order.paid fires.
  const user = await User.findById(requestingUser._id)
    .select('name aceId history.attendedEvents')
    .lean();

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  const attended = user.history?.attendedEvents?.some(
    (entry) => entry.event?.toString() === eventId
  );

  if (!attended) {
    return next(
      new AppError('You did not attend this event or are not eligible for a certificate.', 403)
    );
  }

  // ── 3. Build the data map for template variable substitution ─
  // Keys must match the `label` values defined in event.certificateTemplate.textFields.
  const data = {
    recipientName: user.name,
    aceId: user.aceId || 'GUEST',
    eventTitle: event.title,
    eventDate: formatEventDate(event.eventDate),
    // Extend here if more variables are added to templates in the future
  };

  // ── 4. Render the certificate (entirely in memory) ─────────
  // renderCertificate fetches the R2 image, creates a canvas, stamps all
  // text overlays via percentage→pixel mapping, and returns a PNG Buffer.
  // Nothing is written to disk or uploaded anywhere.
  const pngBuffer = await renderCertificate({
    baseImageUrl: event.certificateTemplate.baseImageUrl,
    textFields: event.certificateTemplate.textFields,
    data,
  });

  // ── 5. Stream the buffer to the client ─────────────────────
  // Sanitize the event title for the filename (strip non-alphanumeric chars)
  const safeTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
  const safeAceId = (user.aceId || 'GUEST').replace(/[^a-zA-Z0-9]/g, '');
  const filename = `ACE_Certificate_${safeAceId}_${safeTitle}.png`;

  res.set({
    'Content-Type': 'image/png',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': pngBuffer.length,
    // Prevent proxies from caching personalized certificates
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
  });

  // Send the buffer — after this call, pngBuffer goes out of scope and is GC'd
  res.end(pngBuffer);
});

/**
 * GET /api/certificates/preview/:eventId
 *
 * Returns a low-res JPEG preview of the certificate (no eligibility check).
 * Used by the Admin Command Center to preview templates during setup.
 *
 * Admin-only: requires restrictTo('admin').
 */
export const previewCertificate = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId).lean();
  if (!event) return next(new AppError('Event not found.', 404));
  if (!event.certificateTemplate?.baseImageUrl) {
    return next(new AppError('No certificate template configured for this event.', 404));
  }

  // Use placeholder data for the preview render
  const data = {
    recipientName: 'PREVIEW NAME',
    aceId: '26ACE0001',
    eventTitle: event.title,
    eventDate: formatEventDate(event.eventDate),
  };

  const pngBuffer = await renderCertificate({
    baseImageUrl: event.certificateTemplate.baseImageUrl,
    textFields: event.certificateTemplate.textFields,
    data,
  });

  res.set({
    'Content-Type': 'image/png',
    'Content-Disposition': 'inline',
    'Cache-Control': 'no-store',
  });

  res.end(pngBuffer);
});
