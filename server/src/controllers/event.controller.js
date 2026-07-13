import Event from '../models/Event.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { eventDeactivateQueue } from '../queues/index.js';

// ── Helper: Schedule BullMQ auto-deactivation job at eventDate ──
// Cancels any existing deactivation job for this event first (idempotent).
const scheduleAutoDeactivation = async (eventId, eventDate) => {
  const jobId = `auto-deactivate-${eventId}`;

  // Remove any previously scheduled job for this event (e.g., date changed)
  const existing = await eventDeactivateQueue.getJob(jobId);
  if (existing) await existing.remove();

  const delay = new Date(eventDate).getTime() - Date.now();
  if (delay <= 0) {
    // Event date is already in the past — deactivate immediately
    await eventDeactivateQueue.add('autoDeactivateEvent', { eventId: eventId.toString() }, {
      jobId,
      delay: 0,
    });
  } else {
    await eventDeactivateQueue.add('autoDeactivateEvent', { eventId: eventId.toString() }, {
      jobId,
      delay,
    });
    console.log(
      `[AutoDeactivate] Scheduled deactivation for event ${eventId} ` +
      `in ${Math.round(delay / 1000 / 60)} minutes (at ${new Date(eventDate).toISOString()})`
    );
  }
};

// ─────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Returns the allowed update fields — prevents mass-assignment of sensitive
 * fields like `registeredCount` or `createdBy` via a PATCH request.
 *
 * @param {Object} body - req.body from a PATCH request
 * @returns {Object} Sanitized update payload
 */
const sanitizeEventUpdate = (body) => {
  const ALLOWED_FIELDS = [
    'title',
    'description',
    'eventDate',
    'registrationDeadline',
    'venue',
    'bannerImage',
    'posterImage',
    'coordinators',
    'memberFee',
    'standardFee',
    'maxCapacity',
    'certificateTemplate',
    'customFormFields',
    'tags',
    'isActive',
    // NOTE: 'status' is intentionally EXCLUDED.
    // Use PATCH /api/admin/events/:id/publish to transition draft → published.
    // NOTE: 'certificatesReleased' is intentionally EXCLUDED.
    // Use PATCH /api/admin/events/:id/release-certificates.
  ];

  return Object.fromEntries(
    Object.entries(body).filter(([key]) => ALLOWED_FIELDS.includes(key))
  );
};

// ─────────────────────────────────────────────────────────────
// PUBLIC CONTROLLERS
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/events
 *
 * Returns events sorted by event date (ascending).
 *
 * Visibility rules:
 *  - Unauthenticated / Guest  → only active events with open registration
 *  - Member / Body Member     → same as guest (they see the same public feed)
 *  - Admin                    → all events regardless of isActive status
 *
 * Note: `isRegistrationOpen` is a Mongoose virtual — it won't survive a `.lean()` call.
 * We keep the full Mongoose documents here so virtuals are available, then use
 * `toObject({ virtuals: true })` before sending the response.
 */
export const getAllEvents = catchAsync(async (req, res, _next) => {
  const isAdmin = req.user && ['admin', 'ebm', 'sbm'].includes(req.user.role);

  // ── Build query filter ────────────────────────────────────
  const filter = isAdmin ? {} : { status: 'published' };

  // ?status=upcoming — only events that haven't passed yet
  if (req.query.status === 'upcoming') {
    filter.eventDate = { $gte: new Date() };
  }

  // ── Sort ─────────────────────────────────────────────────
  // ?sort=desc (default: asc by eventDate)
  const sortDir = req.query.sort === 'desc' ? -1 : 1;

  // ── Limit ────────────────────────────────────────────────
  // ?limit=N — cap at 200 to prevent runaway queries
  const limitVal = req.query.limit
    ? Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50))
    : undefined; // undefined = no limit (return all)

  let query = Event.find(filter)
    .populate('createdBy', 'name aceId role')
    .sort({ eventDate: sortDir });

  if (limitVal) query = query.limit(limitVal);

  const rawEvents = await query;

  // ── Serialize with virtuals ────────────────────────────────
  const events = rawEvents.map((ev) => ev.toObject({ virtuals: true }));

  // ── Non-admins: also drop events where registration is closed ──
  const visibleEvents = isAdmin
    ? events
    : events.filter((ev) => ev.isRegistrationOpen);

  res.status(200).json({
    success: true,
    count: visibleEvents.length,
    data: visibleEvents,
  });
});


/**
 * GET /api/events/:id
 *
 * Returns a single event by its MongoDB ObjectId.
 * Exposed publicly so event detail pages work without login.
 * Admins can view inactive events by ID even though they won't appear in the list.
 */
export const getEventById = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id)
    .populate('createdBy', 'name aceId role');

  if (!event) {
    return next(new AppError('Event not found.', 404));
  }

  const isAdmin = req.user && ['admin', 'ebm', 'sbm'].includes(req.user.role);

  // Non-admins cannot view draft events — they shouldn't exist in the public feed
  if (!isAdmin && event.status !== 'published') {
    return next(new AppError('Event not found.', 404)); // intentionally vague
  }

  // Non-admins cannot view explicitly deactivated events
  if (!isAdmin && !event.isActive) {
    return next(new AppError('Event not found.', 404));
  }

  res.status(200).json({
    success: true,
    data: event.toObject({ virtuals: true }),
  });
});

/**
 * POST /api/events
 *
 * Creates a new club event.
 * Admin / Body Member only — enforced by `restrictTo` in the route layer.
 *
 * Required fields:  title, eventDate, memberFee, standardFee
 * Optional fields:  description, venue, registrationDeadline, maxCapacity,
 *                   bannerImage, certificateTemplate, tags
 *
 * Fees are expected and stored in INR (whole rupees). Conversion to
 * paise (×100) happens in payment.controller.js at order-creation time.
 */
export const createEvent = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    eventDate,
    registrationDeadline,
    venue,
    bannerImage,
    memberFee,
    standardFee,
    maxCapacity,
    certificateTemplate,
    customFormFields,
    tags,
  } = req.body;

  // ── Required field validation ─────────────────────────────
  if (!title || !eventDate) {
    return next(new AppError('Event title and eventDate are required.', 400));
  }

  if (memberFee === undefined || memberFee === null) {
    return next(new AppError('memberFee is required (in INR).', 400));
  }

  if (standardFee === undefined || standardFee === null) {
    return next(new AppError('standardFee is required (in INR).', 400));
  }

  // ── Fee sanity check ──────────────────────────────────────
  // standardFee should never be cheaper than memberFee (would defeat the purpose)
  if (Number(standardFee) < Number(memberFee)) {
    return next(
      new AppError('standardFee cannot be less than memberFee.', 400)
    );
  }

  // ── Date validation ───────────────────────────────────────
  const parsedEventDate = new Date(eventDate);
  if (isNaN(parsedEventDate.getTime())) {
    return next(new AppError('eventDate must be a valid ISO 8601 date string.', 400));
  }

  if (parsedEventDate <= new Date()) {
    return next(new AppError('eventDate must be in the future.', 400));
  }

  // ── Create event ──────────────────────────────────────────
  const newEvent = await Event.create({
    title,
    description,
    eventDate: parsedEventDate,
    registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
    venue,
    bannerImage,
    memberFee: Number(memberFee),
    standardFee: Number(standardFee),
    maxCapacity: maxCapacity ? Number(maxCapacity) : null,
    certificateTemplate: certificateTemplate || null,
    customFormFields: Array.isArray(customFormFields) ? customFormFields : [],
    tags: Array.isArray(tags) ? tags : [],
    createdBy: req.user._id, // injected by `protect` middleware
  });

  // Schedule BullMQ job to auto-deactivate this event when its date arrives
  await scheduleAutoDeactivation(newEvent._id, newEvent.eventDate);

  res.status(201).json({
    success: true,
    data: newEvent.toObject({ virtuals: true }),
  });
});

/**
 * PATCH /api/events/:id
 *
 * Partially updates an existing event.
 * Admin / Body Member only — enforced by `restrictTo` in the route layer.
 *
 * Protected against mass-assignment via `sanitizeEventUpdate()`.
 * `registeredCount` and `createdBy` are NOT in the allowed update list.
 */
export const updateEvent = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // ── Find target event ────────────────────────────────────
  const event = await Event.findById(id);
  if (!event) {
    return next(new AppError('Event not found.', 404));
  }

  // ── Sanitize and apply update fields ────────────────────
  const updates = sanitizeEventUpdate(req.body);

  if (Object.keys(updates).length === 0) {
    return next(new AppError('No valid fields provided for update.', 400));
  }

  // ── Validate dates if provided ────────────────────────────
  if (updates.eventDate) {
    const d = new Date(updates.eventDate);
    if (isNaN(d.getTime())) {
      return next(new AppError('eventDate must be a valid ISO 8601 date string.', 400));
    }
    updates.eventDate = d;
  }

  if (updates.registrationDeadline) {
    const d = new Date(updates.registrationDeadline);
    if (isNaN(d.getTime())) {
      return next(new AppError('registrationDeadline must be a valid ISO 8601 date string.', 400));
    }
    updates.registrationDeadline = d;
  }

  // ── Fee sanity check if both are being updated ────────────
  const newMemberFee   = updates.memberFee   !== undefined ? Number(updates.memberFee)    : event.memberFee;
  const newNonMemberFee = updates.standardFee !== undefined ? Number(updates.standardFee) : event.standardFee;
  if (newNonMemberFee < newMemberFee) {
    return next(new AppError('standardFee cannot be less than memberFee.', 400));
  }

  // ── Apply update atomically ───────────────────────────────
  // Using findByIdAndUpdate ensures we get the updated document.
  // `runValidators: true` fires Mongoose schema validators on the changed fields.
  const updatedEvent = await Event.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('createdBy', 'name aceId role');

  // If eventDate changed, reschedule the auto-deactivation job for the new date
  if (updates.eventDate) {
    await scheduleAutoDeactivation(id, updates.eventDate);
  }

  res.status(200).json({
    success: true,
    data: updatedEvent.toObject({ virtuals: true }),
  });
});

/**
 * PATCH /api/events/:id/toggle
 *
 * Flips the `isActive` boolean flag to open or close ticket sales for an event.
 * Admin / Body Member only — enforced by `restrictTo` in the route layer.
 *
 * `isActive: true`  → event is live and registration is open (subject to deadline/capacity)
 * `isActive: false` → event is deactivated; it disappears from the public feed and
 *                     `isRegistrationOpen` virtual returns false immediately.
 *
 * Atomic: uses $set on the negated current value — no read-modify-write race condition.
 */
export const toggleRegistration = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // ── Fetch current state ───────────────────────────────────
  const event = await Event.findById(id);
  if (!event) {
    return next(new AppError('Event not found.', 404));
  }

  // ── Atomic toggle ─────────────────────────────────────────
  const updatedEvent = await Event.findByIdAndUpdate(
    id,
    { $set: { isActive: !event.isActive } },
    { new: true, runValidators: true }
  ).populate('createdBy', 'name aceId role');

  const newState = updatedEvent.isActive ? 'OPEN' : 'CLOSED';
  console.log(
    `[EventController] Registration ${newState} for "${updatedEvent.title}" (id: ${id}) ` +
    `by ${req.user.email}`  // Admin accounts have no aceId; use email for audit log
  );

  // If re-activated, re-schedule the auto-deactivation job
  if (updatedEvent.isActive) {
    await scheduleAutoDeactivation(id, updatedEvent.eventDate);
  }

  res.status(200).json({
    success: true,
    message: `Registration is now ${newState} for "${updatedEvent.title}".`,
    data: updatedEvent.toObject({ virtuals: true }),
  });
});

/**
 * DELETE /api/admin/events/:id
 *
 * Permanently deletes an event and cascades the deletion to all associated
 * Registrations and Transactions.
 *
 * This is a destructive, irreversible operation. RBAC: admin only.
 *
 * Cascade order:
 *  1. Delete all Registration documents referencing this event
 *  2. Delete all Transaction documents referencing this event
 *  3. Delete the Event document itself
 */
export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return next(new AppError('Event not found.', 404));
    }

    // Cascade: remove all linked registrations
    const Registration = (await import('../models/Registration.js')).default;
    const Transaction  = (await import('../models/Transaction.js')).default;

    const regResult = await Registration.deleteMany({ eventId: id });
    const txnResult = await Transaction.deleteMany({ eventId: id });

    // Delete the event itself
    await Event.findByIdAndDelete(id);

    console.log(
      `[EventController] ${req.user.email} deleted event "${event.title}". ` +
      `Cascade: ${regResult.deletedCount} registrations, ${txnResult.deletedCount} transactions removed.`
    );

    res.status(200).json({
      success: true,
      message: `Event "${event.title}" and all its data have been permanently deleted.`,
      data: {
        deletedRegistrations: regResult.deletedCount,
        deletedTransactions:  txnResult.deletedCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/events/:id/publish
 *
 * Transitions an event from 'draft' → 'published'.
 * Once published, the event appears in the public feed and members/guests can register.
 *
 * RBAC: Admin only. Publishing is an explicit admin decision, not delegatable.
 * Idempotent: publishing an already-published event returns 200 with no change.
 */
export const publishEvent = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const event = await Event.findById(id);
  if (!event) return next(new AppError('Event not found.', 404));

  if (event.status === 'published') {
    return res.status(200).json({
      success: true,
      message: `Event "${event.title}" is already published.`,
      data: event.toObject({ virtuals: true }),
    });
  }

  const updatedEvent = await Event.findByIdAndUpdate(
    id,
    { $set: { status: 'published' } },
    { new: true, runValidators: true }
  ).populate('createdBy', 'name aceId role');

  console.log(
    `[EventController] Event "${updatedEvent.title}" published by ${req.user.email}`
  );

  res.status(200).json({
    success: true,
    message: `Event "${updatedEvent.title}" is now live and visible to members and guests.`,
    data: updatedEvent.toObject({ virtuals: true }),
  });
});

