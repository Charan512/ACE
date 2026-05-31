import Event from '../models/Event.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

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
    'memberFee',
    'standardFee',
    'maxCapacity',
    'certificateTemplate',
    'tags',
    'isActive',
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
  // Non-admins only see active events. The `isRegistrationOpen` virtual further
  // filters at the application layer (it depends on deadline + capacity, which
  // can't be filtered with a simple MongoDB query without duplication).
  const filter = isAdmin ? {} : { isActive: true };

  const rawEvents = await Event.find(filter)
    .populate('createdBy', 'name aceId role')
    .sort({ eventDate: 1 });

  // ── Serialize with virtuals ───────────────────────────────
  const events = rawEvents.map((ev) => ev.toObject({ virtuals: true }));

  // ── Non-admins: drop events where registration is closed ─
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

  // Non-admins cannot view explicitly deactivated events
  const isAdmin = req.user && ['admin', 'ebm', 'sbm'].includes(req.user.role);
  if (!isAdmin && !event.isActive) {
    return next(new AppError('Event not found.', 404)); // intentionally vague
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
 * Fees are expected in PAISE (₹1 = 100 paise) to match Razorpay's native unit.
 * The slug is auto-generated from the title by the Event model's pre-save hook.
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
    tags: Array.isArray(tags) ? tags : [],
    createdBy: req.user._id, // injected by `protect` middleware
  });

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
    `by Admin ${req.user.aceId}`
  );

  res.status(200).json({
    success: true,
    message: `Registration is now ${newState} for "${updatedEvent.title}".`,
    data: updatedEvent.toObject({ virtuals: true }),
  });
});
