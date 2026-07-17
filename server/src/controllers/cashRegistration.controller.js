import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { emailQueue, treasurerQueue } from '../queues/index.js';
import redis from '../config/redis.js';

/**
 * Helper: create an AdminNotification for a cash registration.
 * Dynamically imported to avoid circular dependency issues.
 */
const createCashNotification = async (payload) => {
  const AdminNotification = (await import('../models/AdminNotification.js')).default;
  await AdminNotification.create(payload);

  try {
    await triggerTreasurerDigest();
  } catch (err) {
    console.error('[TreasurerDigest] Failed to trigger digest job:', err);
  }
};

/**
 * Implements the 2.5-hour debounce (10-hour ceiling) Treasurer Digest logic.
 */
const triggerTreasurerDigest = async () => {
  const now = Date.now();
  const DEBOUNCE_MS = 2.5 * 60 * 60 * 1000;
  const CEILING_MS = 10 * 60 * 60 * 1000;

  let firstTriggerStr = await redis.get('treasurer_digest_first_trigger');
  let firstTrigger = firstTriggerStr ? parseInt(firstTriggerStr, 10) : now;

  if (!firstTriggerStr) {
    await redis.set('treasurer_digest_first_trigger', now);
  }

  let delay = DEBOUNCE_MS;
  // If delaying by another 2.5h exceeds the 10h ceiling, cap the delay
  if (now + delay - firstTrigger > CEILING_MS) {
    delay = Math.max(0, firstTrigger + CEILING_MS - now);
  }

  // Remove existing delayed job if it exists so we can push it back by another 2.5h
  const existingJob = await treasurerQueue.getJob('treasurer-digest');
  if (existingJob) {
    const state = await existingJob.getState();
    if (state === 'delayed' || state === 'waiting') {
      await existingJob.remove();
    }
  }

  // Enqueue the new debounced job
  await treasurerQueue.add('sendDigest', {}, { jobId: 'treasurer-digest', delay });
};

// ─────────────────────────────────────────────────────────────
// CASH REGISTER — MEMBER
// ─────────────────────────────────────────────────────────────

/**
 * @desc    SBM/EBM registers an existing ACE Member for an event with cash payment.
 *          No PhonePe flow — registration is created directly as 'confirmed'.
 *
 * @route   POST /api/ops/events/:eventId/cash-register/member
 * @access  Private (SBM / EBM)
 *
 * Body (one of):
 *   { aceId: "26ACE0001" }
 *   { phone: "+91XXXXXXXXXX" }
 */
export const cashRegisterMember = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;
  const { aceId, phone, customResponses } = req.body;

  if (!aceId && !phone) {
    return next(new AppError('Provide aceId or phone to identify the member.', 400));
  }

  // ── 1. Load event ──────────────────────────────────────────
  const event = await Event.findById(eventId);
  if (!event) return next(new AppError('Event not found.', 404));
  if (event.status !== 'published') {
    return next(new AppError('Cannot register for a draft event.', 400));
  }

  // ── 2. Find the member ─────────────────────────────────────
  const query = aceId ? { aceId: aceId.toUpperCase() } : { phone };
  const member = await User.findOne(query).select('name email aceId role phone');

  if (!member) {
    return next(new AppError(`No member found with that ${aceId ? 'ACE ID' : 'phone number'}.`, 404));
  }
  if (member.role !== 'member') {
    return next(new AppError(`User ${member.aceId || member.email} is not an ACE Member (role: ${member.role}).`, 400));
  }

  // ── 2a. Year Exclusivity Gate ──────────────────────────────
  const isOpenToAll = !event.allowedYears?.length ||
    (event.allowedYears.length === 4 && [1,2,3,4].every(y => event.allowedYears.includes(y)));

  if (!isOpenToAll) {
    const userYear = member.year;
    if (!userYear || !event.allowedYears.includes(userYear)) {
      const ordinalMap = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th' };
      const yearStr = event.allowedYears.map(y => `${ordinalMap[y]} Year`).join(', ');
      return next(new AppError(
        `This event is exclusive to ${yearStr} students. Member's year (${userYear || 'unknown'}) is not eligible.`,
        403
      ));
    }
  }

  // ── 3. Duplicate registration guard ───────────────────────
  const existingReg = await Registration.findOne({
    eventId,
    userId: member._id,
    status: { $in: ['confirmed', 'pending'] },
  });
  if (existingReg) {
    return next(new AppError(`${member.name} is already registered for this event.`, 409));
  }

  // ── 4. Create Registration ────────────────────────────────
  const session = await mongoose.startSession();
  session.startTransaction();

  let registration;
  try {
    [registration] = await Registration.create(
      [{
        eventId,
        userId:           member._id,
        name:             member.name,
        email:            member.email,
        tier:             'member',
        status:           'confirmed',
        paymentMethod:    'cash',
        amount:           event.memberFee,
        cashRegisteredBy: req.user._id,
        customResponses:  customResponses || {},
      }],
      { session }
    );

    await Event.findByIdAndUpdate(
      eventId,
      { $inc: { registeredCount: 1 } },
      { session }
    );

    // Push to member's vault
    await User.findByIdAndUpdate(
      member._id,
      {
        $push: {
          'history.attendedEvents': {
            event:      event._id,
            attendedAt: new Date(),
          },
        },
      },
      { session }
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  // ── 5. Write admin notification ───────────────────────────
  await createCashNotification({
    type:             'cash_registration',
    event:            event._id,
    eventTitle:       event.title,
    registrant:       { name: member.name, email: member.email, aceId: member.aceId, type: 'member' },
    registeredBy:     req.user._id,
    registeredByName: req.user.name,
    registeredByRole: req.user.role,
    amount:           event.memberFee,
  });

  console.log(
    `[CashReg] ${req.user.role.toUpperCase()} ${req.user.email} cash-registered ` +
    `member ${member.aceId} for event "${event.title}"`
  );

  res.status(201).json({
    success: true,
    message: `${member.name} (${member.aceId}) has been registered for "${event.title}" (cash payment).`,
    data: registration,
  });
});

// ─────────────────────────────────────────────────────────────
// CASH REGISTER — GUEST
// ─────────────────────────────────────────────────────────────

/**
 * @desc    SBM/EBM registers a guest for an event with cash payment.
 *          Same form flow as guest self-registration, but submitted by staff.
 *          After registration, guest receives a confirmation email with QR code.
 *
 * @route   POST /api/ops/events/:eventId/cash-register/guest
 * @access  Private (SBM / EBM)
 *
 * Body:
 *   {
 *     name:             string,   // required
 *     email:            string,   // required
 *     phone?:           string,
 *     customResponses?: Record<string, string>  // answers to event.customFormFields
 *   }
 */
export const cashRegisterGuest = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;
  const { name, email, phone, year, customResponses } = req.body;

  if (!name || !email) {
    return next(new AppError('name and email are required for guest registration.', 400));
  }

  // ── 1. Load event ──────────────────────────────────────────
  const event = await Event.findById(eventId);
  if (!event) return next(new AppError('Event not found.', 404));
  if (event.status !== 'published') {
    return next(new AppError('Cannot register for a draft event.', 400));
  }

  // ── 1a. Year Exclusivity Gate ──────────────────────────────
  const isOpenToAll = !event.allowedYears?.length ||
    (event.allowedYears.length === 4 && [1,2,3,4].every(y => event.allowedYears.includes(y)));

  if (!isOpenToAll) {
    const guestYear = Number(year);
    if (!guestYear || !event.allowedYears.includes(guestYear)) {
      const ordinalMap = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th' };
      const yearStr = event.allowedYears.map(y => `${ordinalMap[y]} Year`).join(', ');
      return next(new AppError(
        `This event is exclusive to ${yearStr} students. Guest's year (${guestYear || 'unknown'}) is not eligible.`,
        403
      ));
    }
  }

  // ── 2. Duplicate registration guard ───────────────────────
  const existingReg = await Registration.findOne({
    eventId,
    guestEmail: email.toLowerCase(),
    status: { $in: ['confirmed', 'pending'] },
  });
  if (existingReg) {
    return next(new AppError(`${email} is already registered for this event.`, 409));
  }

  // ── 3. Create Registration + Event $inc atomically ────────
  // BUG-01 FIX: Both writes are wrapped in a session so a partial failure
  // (e.g. Registration created but Event $inc fails) cannot leave registeredCount
  // permanently out of sync.
  const session = await mongoose.startSession();
  session.startTransaction();

  let registration;
  try {
    [registration] = await Registration.create(
      [{
        eventId,
        userId:           null,
        guestName:        name,
        guestEmail:       email.toLowerCase(),
        name,
        email:            email.toLowerCase(),
        phone:            phone || null,
        tier:             'non_member',
        status:           'confirmed',
        paymentMethod:    'cash',
        amount:           event.standardFee,
        cashRegisteredBy: req.user._id,
        customResponses:  customResponses || {},
      }],
      { session }
    );

    await Event.findByIdAndUpdate(
      eventId,
      { $inc: { registeredCount: 1 } },
      { session }
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  // ── 4. Enqueue QR confirmation email ──────────────────────
  // Fired AFTER the transaction commits — safe because BullMQ is durable.
  // FIX: Added missing `eventId` so the emailWorker can load the admin-configured
  // confirmation email template for this specific event.
  await emailQueue.add('guestQrEmail', {
    registrationId: registration._id.toString(),
    guestEmail:     email.toLowerCase(),
    guestName:      name,
    eventTitle:     event.title,
    eventDate:      event.eventDate,
    venue:          event.venue || '',
    paymentMethod:  'cash',
    eventId:        eventId,
  });

  // ── 5. Write admin notification ───────────────────────────
  await createCashNotification({
    type:             'cash_registration',
    event:            event._id,
    eventTitle:       event.title,
    registrant:       { name, email: email.toLowerCase(), aceId: null, type: 'guest' },
    registeredBy:     req.user._id,
    registeredByName: req.user.name,
    registeredByRole: req.user.role,
    amount:           event.standardFee,
  });

  console.log(
    `[CashReg] ${req.user.role.toUpperCase()} ${req.user.email} cash-registered ` +
    `guest ${email} for event "${event.title}"`
  );

  res.status(201).json({
    success: true,
    message: `${name} has been registered for "${event.title}" (cash payment). QR code will be emailed to ${email}.`,
    data: registration,
  });
});
