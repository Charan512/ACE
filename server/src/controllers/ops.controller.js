import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// ── Regex to detect ACE ID format: 26ACE0001 ─────────────────
const ACE_ID_REGEX = /^26ACE\d{4}$/;

// ─────────────────────────────────────────────────────────────
// OPS CONTROLLERS
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Get all active events for the Ops Dashboard
 * @route   GET /api/ops/events
 * @access  Private (Admin / EBM / SBM)
 */
export const getOpsEvents = catchAsync(async (req, res, _next) => {
  const events = await Event.find({ isActive: true })
    .select('title description eventDate venue registeredCount maxCapacity')
    .sort({ eventDate: 1 });

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  });
});

/**
 * @desc    Get full roster + stats for an event's Control Room
 * @route   GET /api/ops/events/:eventId/roster
 * @access  Private (Admin / EBM / SBM)
 *
 * Returns:
 *   event: { _id, title, eventDate, venue }
 *   stats: { total, checkedIn, pending }
 *   roster: [{ _id, name, email, phone, tier, status, checkedIn, checkedInAt,
 *              userId: { name, aceId, branch, section, registrationNumber } }]
 */
export const getRoster = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId)
    .select('title eventDate venue registeredCount');
  if (!event) return next(new AppError('Event not found.', 404));

  // Only confirmed registrations matter for on-ground ops
  const roster = await Registration.find({ eventId, status: 'confirmed' })
    .populate('userId', 'name aceId branch section year registrationNumber phone')
    .sort({ name: 1 });

  const total     = roster.length;
  const checkedIn = roster.filter(r => r.checkedIn).length;
  const pending   = total - checkedIn;

  res.status(200).json({
    success: true,
    event: {
      _id:      event._id,
      title:    event.title,
      eventDate: event.eventDate,
      venue:    event.venue,
    },
    stats: { total, checkedIn, pending },
    data:  roster,
  });
});

/**
 * @desc    Check in a registrant — QR scanner or manual override
 * @route   PUT /api/ops/events/:eventId/checkin
 * @access  Private (Admin / EBM / SBM)
 *
 * Body (one of):
 *   { aceId: "26ACE0001" }          — from QR scanner
 *   { userId: "<mongoId>" }         — from QR scanner (guest fallback)
 *   { registrationId: "<mongoId>" } — from manual roster button
 *
 * Idempotency: Returns 400 ALREADY_SCANNED if already checked in.
 */
export const checkIn = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;
  const { aceId, userId, registrationId } = req.body;

  if (!aceId && !userId && !registrationId) {
    return next(new AppError('Provide aceId, userId, or registrationId to check in.', 400));
  }

  // ── Step 1: Resolve the Registration document ─────────────
  let registration;

  if (registrationId) {
    // Manual roster override — direct lookup by registrationId
    registration = await Registration.findOne({ _id: registrationId, eventId });
  } else if (aceId) {
    // QR scan: aceId → find the user → find their registration
    const user = await User.findOne({ aceId }).select('_id');
    if (!user) return next(new AppError(`No member found with ACE ID: ${aceId}.`, 404));
    registration = await Registration.findOne({ eventId, userId: user._id });
  } else if (userId) {
    // QR scan fallback: direct userId lookup
    registration = await Registration.findOne({ eventId, userId });
  }

  if (!registration) {
    return next(new AppError('No confirmed registration found for this person at this event.', 404));
  }

  // ── Step 2: Idempotency guard ─────────────────────────────
  if (registration.checkedIn) {
    return next(new AppError('ALREADY_SCANNED', 400));
  }

  // ── Step 3: Perform check-in ──────────────────────────────
  registration.checkedIn   = true;
  registration.checkedInAt = new Date();
  registration.checkedInBy = req.user._id;
  await registration.save();

  // Populate for the response
  await registration.populate('userId', 'name aceId branch section registrationNumber');

  console.log(
    `[OpsCheckin] ${req.user.name} checked in: ${registration.name} @ event ${eventId}`
  );

  res.status(200).json({
    success: true,
    message: 'CHECK_IN_SUCCESS',
    data: registration,
  });
});

/**
 * @desc    Verify a member by ACE ID or userId — READ ONLY, no mutations
 * @route   GET /api/ops/verify/:scannedId
 * @access  Private (Admin / EBM / SBM)
 *
 * scannedId can be:
 *   - An ACE ID string: "26ACE0001"
 *   - A MongoDB ObjectId hex string (guest fallback)
 */
export const verifyMember = catchAsync(async (req, res, next) => {
  const { scannedId } = req.params;

  let user;

  if (ACE_ID_REGEX.test(scannedId)) {
    // Standard member scan: ACE ID
    user = await User.findOne({ aceId: scannedId })
      .select('name aceId email role branch section year registrationNumber phone');
  } else {
    // Fallback: treat as MongoDB _id (guests / non-ACE users)
    user = await User.findById(scannedId)
      .select('name aceId email role branch section year registrationNumber phone');
  }

  if (!user) {
    return next(new AppError('INVALID_ID — No ACE member found for this scan.', 404));
  }

  res.status(200).json({
    success: true,
    valid: true,
    data: {
      _id:                user._id,
      name:               user.name,
      aceId:              user.aceId || null,
      role:               user.role,
      branch:             user.branch || null,
      section:            user.section || null,
      year:               user.year || null,
      registrationNumber: user.registrationNumber || null,
      phone:              user.phone || null,
    },
  });
});
