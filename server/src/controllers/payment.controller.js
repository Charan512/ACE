import crypto from 'crypto';
import mongoose from 'mongoose';
import razorpay from '../config/razorpay.js';
import Transaction from '../models/Transaction.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import generateTempPassword from '../utils/generatePassword.js';
import { emailQueue, scheduleTreasurerFlush, lateConverterQueue } from '../queues/index.js';

// ─────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Verifies a Razorpay webhook signature using HMAC SHA256.
 *
 * Razorpay signs the raw request body with RAZORPAY_WEBHOOK_SECRET.
 * We recompute the HMAC and compare using timingSafeEqual to prevent
 * timing-based side-channel attacks.
 *
 * MUST be called before any database reads or writes.
 *
 * @param {Buffer} rawBody  - The raw request body buffer (from express.raw())
 * @param {string} signature - Value of the X-Razorpay-Signature header
 * @returns {boolean} true if signature is valid
 */
const verifyWebhookSignature = (rawBody, signature) => {
  if (!rawBody || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  // timingSafeEqual prevents timing attacks by always comparing all bytes
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    // Buffers of different length throw — means signature is definitely wrong
    return false;
  }
};

/**
 * Handles the `order.paid` / `payment.captured` webhook event.
 *
 * This is the core business logic trigger:
 *  1. Find the pending Transaction by razorpayOrderId
 *  2. Idempotency guard — skip if already processed
 *  3. Atomically update Transaction to 'paid'
 *  4. Increment event.registeredCount
 *  5. If a registered user exists — update their Member Vault
 *  6. If it's a NEW MEMBER purchase — generate aceId, set temp password, queue email
 *
 * @param {Object} payload - Parsed Razorpay webhook payload
 */
const handleOrderPaid = async (payload) => {
  const paymentEntity = payload?.payload?.payment?.entity;
  if (!paymentEntity) {
    console.error('[Webhook] order.paid: Missing payment entity in payload.');
    return;
  }

  const razorpayOrderId = paymentEntity.order_id;
  const razorpayPaymentId = paymentEntity.id;
  // Razorpay sends the signature in the event-level metadata for order.paid
  const razorpaySignature = payload?.payload?.payment?.entity?.acquirer_data?.rrn ?? null;

  // ── 1. Find transaction ────────────────────────────────────
  const transaction = await Transaction.findOne({ razorpayOrderId }).populate('event user');
  if (!transaction) {
    console.error(`[Webhook] order.paid: No transaction found for orderId=${razorpayOrderId}`);
    return;
  }

  // ── 2. Idempotency guard ───────────────────────────────────
  // Razorpay can retry webhooks — if we've already processed this payment, silently skip.
  if (transaction.status === 'paid') {
    console.log(`[Webhook] order.paid: Transaction ${razorpayOrderId} already processed. Skipping.`);
    return;
  }

  // ── 3. Start a Mongoose session for atomic multi-document updates ──
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ── 4. Update Transaction to paid ─────────────────────────
    transaction.status = 'paid';
    transaction.razorpayPaymentId = razorpayPaymentId;
    transaction.razorpaySignature = razorpaySignature;
    transaction.processedAt = new Date();
    transaction.webhookPayload = payload;
    await transaction.save({ session });

    // ── 5. Increment event registration count (atomic) ────────
    await Event.findByIdAndUpdate(
      transaction.event._id,
      { $inc: { registeredCount: 1 } },
      { session }
    );

    // ── 6. Check if this is tied to an existing member ────────
    if (transaction.user) {
      // Push attendance into their Member Vault
      await User.findByIdAndUpdate(
        transaction.user._id,
        {
          $push: {
            'history.attendedEvents': {
              event: transaction.event._id,
              transaction: transaction._id,
              attendedAt: new Date(),
            },
          },
        },
        { session }
      );
    }

    // ── 7. New Member account creation ────────────────────────
    // notes.purpose === 'membership' indicates the user is buying ACE membership.
    // The order creation endpoint sets this via Razorpay order notes.
    const notes = paymentEntity.notes || {};
    const isMembershipPurchase = notes.purpose === 'membership';

    if (isMembershipPurchase && notes.guestEmail) {
      // Check if user already exists (idempotency in case of webhook replay)
      const existingUser = await User.findOne({ email: notes.guestEmail }).session(session);

      if (!existingUser) {
        // Generate aceId atomically — single findOneAndUpdate + $inc, no race condition
        const aceId = await User.generateAceId();

        // Generate a CSPRNG 8-char temporary password
        const tempPassword = generateTempPassword();

        const newUser = new User({
          name: notes.guestName || 'ACE Member',
          email: notes.guestEmail,
          password: tempPassword, // pre-save hook will bcrypt this
          aceId,
          role: 'member',
          requiresPasswordChange: true, // Forces change on first login
          isEmailVerified: true,        // Verified via Razorpay payment flow
        });
        await newUser.save({ session });

        // Link the transaction to the new user
        transaction.user = newUser._id;
        await transaction.save({ session });

        // ── Queue welcome email with temp credentials ──────────
        // Email sent via BullMQ email queue (Phase 5)
        console.log(
          `[Webhook] New member created: ${aceId} | ${notes.guestEmail}`
        );
        await emailQueue.add('welcomeEmail', { userId: newUser._id, aceId, tempPassword });

        // ── Queue Late Converter ────────────────────────────────
        // Migrate any past guest history to their new Member Vault
        await lateConverterQueue.add('migrate', { userId: newUser._id, email: notes.guestEmail });
      }
    }

    await session.commitTransaction();
    console.log(`[Webhook] order.paid processed successfully for orderId=${razorpayOrderId}`);

    // ── 8. Schedule Treasurer Digest Flush (Debounce & Flush) ─
    await scheduleTreasurerFlush({ transactionId: transaction._id });
  } catch (error) {
    await session.abortTransaction();
    console.error(`[Webhook] order.paid transaction aborted: ${error.message}`);
    throw error; // Re-throw so the webhook handler returns 500 and Razorpay retries
  } finally {
    session.endSession();
  }
};

/**
 * Handles the `payment.failed` webhook event.
 *
 * Updates the Transaction status to 'failed' and stores the raw payload for audit.
 *
 * @param {Object} payload - Parsed Razorpay webhook payload
 */
const handlePaymentFailed = async (payload) => {
  const paymentEntity = payload?.payload?.payment?.entity;
  if (!paymentEntity) {
    console.error('[Webhook] payment.failed: Missing payment entity in payload.');
    return;
  }

  const razorpayOrderId = paymentEntity.order_id;
  const razorpayPaymentId = paymentEntity.id;

  const transaction = await Transaction.findOne({ razorpayOrderId }).populate('user event');
  if (!transaction) {
    console.error(`[Webhook] payment.failed: No transaction found for orderId=${razorpayOrderId}`);
    return;
  }

  // Idempotency: don't overwrite a 'paid' status with 'failed' (Razorpay edge case)
  if (transaction.status === 'paid') {
    console.warn(`[Webhook] payment.failed: Transaction ${razorpayOrderId} is already paid. Ignoring failure event.`);
    return;
  }

  transaction.status = 'failed';
  transaction.razorpayPaymentId = razorpayPaymentId;
  transaction.processedAt = new Date();
  transaction.webhookPayload = payload;
  await transaction.save();

  await emailQueue.add('paymentFailedEmail', {
    email: transaction.guestEmail || transaction.user?.email,
    name: transaction.guestName || transaction.user?.name,
    eventTitle: transaction.event?.title,
  });

  console.log(`[Webhook] payment.failed processed for orderId=${razorpayOrderId}`);
};

// ─────────────────────────────────────────────────────────────
// PUBLIC CONTROLLERS
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/payments/order
 *
 * Creates a Razorpay order for event registration.
 * Determines pricing tier from user role.
 * Stores a Transaction document immediately (status: 'created').
 *
 * Protected: requires JWT auth (guests use a separate guest-checkout route).
 */
export const createOrder = catchAsync(async (req, res, next) => {
  const { eventId, guestEmail, guestName } = req.body;
  const currentUser = req.user || null; // May be null for guest flow

  if (!eventId) {
    return next(new AppError('Event ID is required.', 400));
  }

  const event = await Event.findById(eventId);
  if (!event) return next(new AppError('Event not found.', 404));
  if (!event.isRegistrationOpen) {
    return next(new AppError('Registration is closed for this event.', 400));
  }

  // ── Determine pricing tier ─────────────────────────────────
  const isMember = currentUser && ['member', 'body_member', 'admin'].includes(currentUser.role);
  const tier = isMember ? 'member' : 'non_member';
  const amount = (isMember ? event.memberFee : event.standardFee) * 100; // convert INR to paise for Razorpay

  // ── Create Razorpay order ──────────────────────────────────
  const razorpayOrder = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `ace_${Date.now()}`,
    notes: {
      eventId: eventId.toString(),
      userId: currentUser?._id.toString() || null,
      guestEmail: guestEmail || null,
      guestName: guestName || null,
      tier,
      purpose: 'event_registration',
    },
  });

  // ── Persist Transaction (status: 'created') ────────────────
  await Transaction.create({
    razorpayOrderId: razorpayOrder.id,
    user: currentUser?._id || null,
    guestEmail: guestEmail || null,
    guestName: guestName || null,
    event: eventId,
    amount,
    tier,
    status: 'created',
  });

  res.status(201).json({
    success: true,
    data: {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // Safe: public key only
    },
  });
});

/**
 * POST /api/payments/membership-order
 *
 * Creates a Razorpay order specifically for buying an ACE Membership.
 * Guest-only route (authenticated members don't need a membership order).
 * Sets purpose: 'membership' in Razorpay notes so the webhook knows to create a User account.
 */
export const createMembershipOrder = catchAsync(async (req, res, next) => {
  const { email, name, eventId } = req.body;

  if (!email || !name) {
    return next(new AppError('Email and name are required for membership registration.', 400));
  }

  // Prevent duplicate memberships
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser && existingUser.role !== 'guest') {
    return next(new AppError('An ACE membership already exists for this email.', 409));
  }

  // If bundling with event registration, validate the event
  let event = null;
  let totalAmount = 0; // In paise — define membership fee via env or a config collection
  if (eventId) {
    event = await Event.findById(eventId);
    if (!event) return next(new AppError('Event not found.', 404));
    totalAmount += event.memberFee; // Member gets the lower rate after joining
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: totalAmount || 50000, // ₹500 membership fee (50000 paise) if no event
    currency: 'INR',
    receipt: `ace_mem_${Date.now()}`,
    notes: {
      purpose: 'membership',
      guestEmail: email.toLowerCase(),
      guestName: name,
      eventId: eventId?.toString() || null,
    },
  });

  // Store transaction — no user yet (will be created when webhook fires)
  await Transaction.create({
    razorpayOrderId: razorpayOrder.id,
    user: null,
    guestEmail: email.toLowerCase(),
    guestName: name,
    event: eventId || null,
    amount: razorpayOrder.amount,
    tier: 'member', // They're buying membership so member rate applies
    status: 'created',
  });

  res.status(201).json({
    success: true,
    data: {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

/**
 * POST /api/payments/webhook
 *
 * ⚠️  SECURITY-CRITICAL ENDPOINT
 *
 * This route receives raw Buffer bodies (express.raw middleware applied in index.js).
 * ALL database writes are gated behind HMAC SHA256 signature verification.
 * No user input is trusted before the signature check passes.
 *
 * Razorpay may retry failed webhooks up to 5 times — all handlers are idempotent.
 * We always return HTTP 200 to Razorpay to prevent unnecessary retries after processing.
 */
export const handleWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body; // Buffer — from express.raw() applied in index.js

  // ── STEP 1: Verify HMAC SHA256 signature ──────────────────
  // This is the FIRST thing we do. Nothing proceeds without a valid signature.
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('[Webhook] ❌ Invalid signature — request rejected.');
    // Return 400 to signal rejection, but do NOT reveal why to the caller
    return res.status(400).json({ success: false, message: 'Invalid signature.' });
  }

  // ── STEP 2: Parse the raw body as JSON ────────────────────
  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    console.error('[Webhook] ❌ Failed to parse JSON payload.');
    return res.status(400).json({ success: false, message: 'Invalid payload.' });
  }

  const eventType = payload.event;
  console.log(`[Webhook] ✅ Signature verified. Processing event: ${eventType}`);

  // ── STEP 3: Route to the correct handler ─────────────────
  try {
    switch (eventType) {
      case 'order.paid':
      case 'payment.captured':
        await handleOrderPaid(payload);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;

      default:
        // Acknowledge unknown events — Razorpay sends many event types
        console.log(`[Webhook] Unhandled event type: ${eventType}. Acknowledged.`);
    }
  } catch (error) {
    // Log the error but return 500 so Razorpay retries the webhook
    console.error(`[Webhook] Handler threw an error for ${eventType}:`, error.message);
    return res.status(500).json({ success: false, message: 'Internal processing error.' });
  }

  // ── STEP 4: Acknowledge to Razorpay ──────────────────────
  // Razorpay considers a 2xx response as successful delivery.
  res.status(200).json({ success: true, received: true });
};
