import crypto from 'crypto';
import mongoose from 'mongoose';
import fetch from 'node-fetch'; // Node 18+ has native fetch; use node-fetch for Node 16
import {
  PHONEPE_MERCHANT_ID,
  PHONEPE_BASE_URL,
  SALT_INDEX,
  generateChecksum,
  generateStatusChecksum,
  verifyWebhookChecksum,
} from '../config/phonepe.js';
import Transaction from '../models/Transaction.js';
import Registration from '../models/Registration.js';
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
 * Generates a unique merchantTransactionId for PhonePe.
 * Must be ≤ 35 characters and alphanumeric + underscore only.
 */
const generateMerchantTxnId = () => {
  const ts  = Date.now().toString(36).toUpperCase(); // ~8 chars
  const rnd = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars
  return `ACE_${ts}_${rnd}`; // e.g. ACE_LSDKJ2_A3F9B1C2 — always ≤ 35
};

/**
 * Core business logic: handles a confirmed payment from PhonePe.
 * Called by both the webhook handler and the dev-confirm endpoint.
 *
 * Atomically:
 *  1. Marks Transaction as 'paid'
 *  2. Increments event.registeredCount
 *  3. Pushes event to member's history vault
 *  4. Creates a confirmed Registration record
 *  5. If membership purchase → creates new User account with temp password + email
 *
 * Fully idempotent — safe for webhook replay.
 *
 * @param {string} merchantTransactionId
 * @param {string} phonePeTransactionId
 * @param {Object} rawPayload - The full webhook payload (for audit storage)
 * @param {Object} notes      - Metadata: { purpose, guestEmail, guestName, eventId }
 */
const handlePaymentSuccess = async (merchantTransactionId, phonePeTransactionId, rawPayload, notes = {}) => {
  // ── 1. Find transaction ──────────────────────────────────────
  const transaction = await Transaction.findOne({ merchantTransactionId }).populate('event user');
  if (!transaction) {
    console.error(`[PhonePe] handlePaymentSuccess: No transaction for ${merchantTransactionId}`);
    return;
  }

  // ── 2. Idempotency guard ─────────────────────────────────────
  if (transaction.status === 'paid') {
    console.log(`[PhonePe] ${merchantTransactionId} already processed. Skipping.`);
    return;
  }

  // ── 3. Atomic multi-document update ─────────────────────────
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Mark transaction as paid
    transaction.status             = 'paid';
    transaction.phonePeTransactionId = phonePeTransactionId;
    transaction.processedAt        = new Date();
    transaction.webhookPayload     = rawPayload;
    await transaction.save({ session });

    // Increment event registration count
    await Event.findByIdAndUpdate(
      transaction.event._id,
      { $inc: { registeredCount: 1 } },
      { session }
    );

    // Push to member vault if this is a logged-in member
    if (transaction.user) {
      await User.findByIdAndUpdate(
        transaction.user._id,
        {
          $push: {
            'history.attendedEvents': {
              event:       transaction.event._id,
              transaction: transaction._id,
              attendedAt:  new Date(),
            },
          },
        },
        { session }
      );

      // Create confirmed Registration record (idempotent)
      const existingReg = await Registration.findOne({
        eventId: transaction.event._id,
        userId:  transaction.user._id,
      }).session(session);

      if (!existingReg) {
        await Registration.create(
          [{
            eventId:         transaction.event._id,
            userId:          transaction.user._id,
            name:            transaction.user.name || 'ACE Member',
            email:           transaction.user.email || '',
            tier:            transaction.tier,
            status:          'confirmed',
            transactionId:   transaction._id,
            customResponses: {},
          }],
          { session }
        );
      }
    }

    // ── New Member account creation ──────────────────────────
    const isMembershipPurchase = notes.purpose === 'membership';

    if (isMembershipPurchase && notes.guestEmail) {
      const existingUser = await User.findOne({ email: notes.guestEmail }).session(session);

      if (!existingUser) {
        const aceId        = await User.generateAceId();
        const tempPassword = generateTempPassword();

        const newUser = new User({
          name:                   notes.guestName || 'ACE Member',
          email:                  notes.guestEmail,
          password:               tempPassword, // pre-save hook bcrypts this
          aceId,
          role:                   'member',
          requiresPasswordChange: true,
          isEmailVerified:        true,
        });
        await newUser.save({ session });

        transaction.user = newUser._id;
        await transaction.save({ session });

        await emailQueue.add('welcomeEmail', { userId: newUser._id, aceId, tempPassword });
        await lateConverterQueue.add('migrate', { userId: newUser._id, email: notes.guestEmail });

        console.log(`[PhonePe] New member created: ${aceId} | ${notes.guestEmail}`);
      }
    }

    await session.commitTransaction();
    console.log(`[PhonePe] Payment success processed: ${merchantTransactionId}`);

    await scheduleTreasurerFlush({ transactionId: transaction._id });
  } catch (error) {
    await session.abortTransaction();
    console.error(`[PhonePe] Transaction aborted for ${merchantTransactionId}:`, error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Marks a transaction as failed and sends a failure email.
 */
const handlePaymentFailure = async (merchantTransactionId, rawPayload) => {
  const transaction = await Transaction.findOne({ merchantTransactionId }).populate('user event');
  if (!transaction) {
    console.error(`[PhonePe] handlePaymentFailure: No transaction for ${merchantTransactionId}`);
    return;
  }

  if (transaction.status === 'paid') {
    console.warn(`[PhonePe] ${merchantTransactionId} already paid — ignoring failure.`);
    return;
  }

  transaction.status         = 'failed';
  transaction.processedAt    = new Date();
  transaction.webhookPayload = rawPayload;
  await transaction.save();

  await emailQueue.add('paymentFailedEmail', {
    email:      transaction.guestEmail || transaction.user?.email,
    name:       transaction.guestName  || transaction.user?.name,
    eventTitle: transaction.event?.title,
  });

  console.log(`[PhonePe] Payment failure recorded: ${merchantTransactionId}`);
};

// ─────────────────────────────────────────────────────────────
// PUBLIC CONTROLLERS
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/payments/order
 *
 * Creates a PhonePe payment for event registration.
 * Returns a redirectUrl — the frontend navigates the user to this URL.
 *
 * Protected: requires JWT auth.
 */
export const createOrder = catchAsync(async (req, res, next) => {
  const { eventId } = req.body;
  const currentUser = req.user;

  if (!eventId) return next(new AppError('Event ID is required.', 400));

  const event = await Event.findById(eventId);
  if (!event)                    return next(new AppError('Event not found.', 404));
  if (!event.isRegistrationOpen) return next(new AppError('Registration is closed for this event.', 400));

  // Determine pricing tier
  const isMember = currentUser && ['member', 'sbm', 'ebm', 'admin'].includes(currentUser.role);
  const tier      = isMember ? 'member' : 'non_member';
  const amount    = (isMember ? event.memberFee : event.standardFee) * 100; // paise

  const merchantTransactionId = generateMerchantTxnId();
  const redirectUrl           = `${process.env.CLIENT_URL}/payment/callback`;
  const callbackUrl           = `${process.env.SERVER_URL || 'http://localhost:5000'}/api/payments/webhook`;

  // ── DEV: Skip PhonePe API, return mock redirect ─────────────
  if (process.env.NODE_ENV !== 'production') {
    await Transaction.create({
      merchantTransactionId,
      user:      currentUser._id,
      event:     eventId,
      amount,
      tier,
      status:    'created',
    });

    return res.status(201).json({
      success: true,
      data: {
        merchantTransactionId,
        redirectUrl: `${process.env.CLIENT_URL}/payment/callback?txnId=${merchantTransactionId}&mode=dev`,
      },
    });
  }

  // ── PRODUCTION: Call PhonePe /pg/v1/pay ─────────────────────
  const payPayload = {
    merchantId:            PHONEPE_MERCHANT_ID,
    merchantTransactionId,
    merchantUserId:        currentUser._id.toString(),
    amount,
    redirectUrl,
    redirectMode:          'REDIRECT',
    callbackUrl,
    paymentInstrument:     { type: 'PAY_PAGE' },
  };

  const base64Payload = Buffer.from(JSON.stringify(payPayload)).toString('base64');
  const xVerify       = generateChecksum(base64Payload, '/pg/v1/pay');

  const phonePeRes = await fetch(`${PHONEPE_BASE_URL}/pg/v1/pay`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify },
    body:    JSON.stringify({ request: base64Payload }),
  });

  const phonePeData = await phonePeRes.json();

  if (!phonePeData.success) {
    console.error('[PhonePe] Order creation failed:', phonePeData);
    return next(new AppError(phonePeData.message || 'PhonePe order creation failed.', 502));
  }

  // Persist Transaction
  await Transaction.create({
    merchantTransactionId,
    user:   currentUser._id,
    event:  eventId,
    amount,
    tier,
    status: 'created',
  });

  res.status(201).json({
    success: true,
    data: {
      merchantTransactionId,
      redirectUrl: phonePeData.data.instrumentResponse.redirectInfo.url,
    },
  });
});

/**
 * POST /api/payments/membership-order
 *
 * Creates a PhonePe payment for purchasing an ACE Membership (guest flow).
 * Returns redirectUrl — user is sent to PhonePe's hosted page.
 */
export const createMembershipOrder = catchAsync(async (req, res, next) => {
  const { email, name, eventId, phone, customResponses } = req.body;

  if (!email || !name) {
    return next(new AppError('Email and name are required for membership registration.', 400));
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser && existingUser.role !== 'guest') {
    return next(new AppError('An ACE membership already exists for this email.', 409));
  }

  let totalAmount = 50000; // ₹500 default membership fee (in paise)
  let event       = null;

  if (eventId) {
    event = await Event.findById(eventId);
    if (!event) return next(new AppError('Event not found.', 404));
    totalAmount = event.memberFee * 100;
  }

  const merchantTransactionId = generateMerchantTxnId();
  const redirectUrl           = `${process.env.CLIENT_URL}/payment/callback`;
  const callbackUrl           = `${process.env.SERVER_URL || 'http://localhost:5000'}/api/payments/webhook`;

  // ── DEV: Mock redirect ───────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    await Transaction.create({
      merchantTransactionId,
      user:        null,
      guestEmail:  email.toLowerCase(),
      guestName:   name,
      event:       eventId || null,
      amount:      totalAmount,
      tier:        'member',
      status:      'created',
    });

    return res.status(201).json({
      success: true,
      data: {
        merchantTransactionId,
        redirectUrl: `${process.env.CLIENT_URL}/payment/callback?txnId=${merchantTransactionId}&mode=dev&purpose=membership&guestEmail=${encodeURIComponent(email)}&guestName=${encodeURIComponent(name)}`,
      },
    });
  }

  // ── PRODUCTION ───────────────────────────────────────────────
  const payPayload = {
    merchantId:            PHONEPE_MERCHANT_ID,
    merchantTransactionId,
    merchantUserId:        `GUEST_${Date.now()}`,
    amount:                totalAmount,
    redirectUrl,
    redirectMode:          'REDIRECT',
    callbackUrl,
    paymentInstrument:     { type: 'PAY_PAGE' },
  };

  const base64Payload = Buffer.from(JSON.stringify(payPayload)).toString('base64');
  const xVerify       = generateChecksum(base64Payload, '/pg/v1/pay');

  const phonePeRes = await fetch(`${PHONEPE_BASE_URL}/pg/v1/pay`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify },
    body:    JSON.stringify({ request: base64Payload }),
  });

  const phonePeData = await phonePeRes.json();

  if (!phonePeData.success) {
    console.error('[PhonePe] Membership order creation failed:', phonePeData);
    return next(new AppError(phonePeData.message || 'PhonePe order creation failed.', 502));
  }

  await Transaction.create({
    merchantTransactionId,
    user:        null,
    guestEmail:  email.toLowerCase(),
    guestName:   name,
    event:       eventId || null,
    amount:      totalAmount,
    tier:        'member',
    status:      'created',
  });

  res.status(201).json({
    success: true,
    data: {
      merchantTransactionId,
      redirectUrl: phonePeData.data.instrumentResponse.redirectInfo.url,
    },
  });
});

/**
 * GET /api/payments/verify/:merchantTransactionId
 *
 * SECURITY-CRITICAL: Called by the frontend PaymentCallback page
 * after the user returns from PhonePe's hosted payment page.
 *
 * We NEVER trust the redirect URL params — always verify via
 * a server-to-server call to PhonePe's Status API.
 *
 * Returns: { status: 'SUCCESS' | 'PENDING' | 'FAILED' }
 */
export const verifyAndConfirm = catchAsync(async (req, res, next) => {
  const { merchantTransactionId } = req.params;

  // ── DEV: Skip PhonePe API ────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const txn = await Transaction.findOne({ merchantTransactionId });
    if (!txn) return next(new AppError('Transaction not found.', 404));

    // Check if dev-confirm already ran
    if (txn.status === 'paid') {
      return res.status(200).json({ success: true, data: { status: 'SUCCESS' } });
    }

    return res.status(200).json({ success: true, data: { status: 'PENDING' } });
  }

  // ── PRODUCTION: PhonePe Status API ──────────────────────────
  const xVerify = generateStatusChecksum(merchantTransactionId);
  const url     = `${PHONEPE_BASE_URL}/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`;

  const statusRes  = await fetch(url, {
    method:  'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY':      xVerify,
      'X-MERCHANT-ID': PHONEPE_MERCHANT_ID,
    },
  });

  const statusData = await statusRes.json();

  const code           = statusData.code;            // e.g. PAYMENT_SUCCESS
  const phonePeTxnId   = statusData.data?.transactionId;

  if (code === 'PAYMENT_SUCCESS') {
    // Process if not already done (idempotent)
    await handlePaymentSuccess(
      merchantTransactionId,
      phonePeTxnId,
      statusData,
      statusData.data?.merchantOrderId ? { purpose: 'event_registration' } : {}
    );
    return res.status(200).json({ success: true, data: { status: 'SUCCESS' } });
  }

  if (code === 'PAYMENT_ERROR' || code === 'PAYMENT_CANCELLED' || code === 'TIMED_OUT') {
    await handlePaymentFailure(merchantTransactionId, statusData);
    return res.status(200).json({ success: true, data: { status: 'FAILED', code } });
  }

  // PAYMENT_PENDING or unknown
  return res.status(200).json({ success: true, data: { status: 'PENDING', code } });
});

/**
 * POST /api/payments/webhook
 *
 * SECURITY-CRITICAL: PhonePe server-to-server callback.
 *
 * PhonePe POSTs a JSON body to this URL with an X-VERIFY header.
 * We verify the checksum before any database operations.
 * This is the primary payment confirmation mechanism.
 */
export const handleWebhook = async (req, res) => {
  const xVerify       = req.headers['x-verify'];
  const rawBodyString = JSON.stringify(req.body); // PhonePe sends regular JSON

  // ── Verify X-VERIFY checksum ─────────────────────────────────
  if (!verifyWebhookChecksum(rawBodyString, xVerify)) {
    console.error('[PhonePe Webhook] Invalid X-VERIFY — request rejected.');
    return res.status(400).json({ success: false, message: 'Invalid signature.' });
  }

  const payload = req.body;
  const code    = payload.code; // PAYMENT_IS_INSTRUMENTED, PAYMENT_ERROR, etc.

  console.log(`[PhonePe Webhook] Verified. Code: ${code}`);

  // Decode the base64 response if present
  let responseData = {};
  try {
    if (payload.response) {
      responseData = JSON.parse(Buffer.from(payload.response, 'base64').toString('utf8'));
    }
  } catch {
    console.error('[PhonePe Webhook] Failed to decode response.');
    return res.status(400).json({ success: false, message: 'Invalid payload.' });
  }

  const merchantTransactionId = responseData.merchantTransactionId || responseData.data?.merchantTransactionId;
  const phonePeTxnId          = responseData.transactionId || responseData.data?.transactionId;

  try {
    if (code === 'PAYMENT_IS_INSTRUMENTED' || code === 'PAYMENT_SUCCESS') {
      const notes = responseData.merchantOrderId?.includes('mem')
        ? { purpose: 'membership', guestEmail: responseData.guestEmail, guestName: responseData.guestName }
        : { purpose: 'event_registration' };

      await handlePaymentSuccess(merchantTransactionId, phonePeTxnId, payload, notes);
    } else if (code === 'PAYMENT_ERROR' || code === 'PAYMENT_CANCELLED') {
      await handlePaymentFailure(merchantTransactionId, payload);
    } else {
      console.log(`[PhonePe Webhook] Unhandled code: ${code}`);
    }
  } catch (error) {
    console.error(`[PhonePe Webhook] Error processing ${code}:`, error.message);
    return res.status(500).json({ success: false, message: 'Internal error.' });
  }

  // PhonePe requires a 200 to confirm receipt
  res.status(200).json({ success: true, received: true });
};

/**
 * POST /api/payments/dev-confirm  (DEV ONLY)
 *
 * Simulates PhonePe webhook confirmation for local development.
 * Directly calls handlePaymentSuccess without any network call.
 *
 * Body: { merchantTransactionId: string, purpose?: 'membership', guestEmail?: string, guestName?: string }
 */
export const devConfirm = catchAsync(async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return next(new AppError('Not available in production.', 403));
  }

  const { merchantTransactionId, purpose, guestEmail, guestName } = req.body;
  if (!merchantTransactionId) {
    return next(new AppError('merchantTransactionId is required.', 400));
  }

  const transaction = await Transaction.findOne({ merchantTransactionId });
  if (!transaction) {
    return next(new AppError(`No transaction found for: ${merchantTransactionId}`, 404));
  }

  if (transaction.status === 'paid') {
    return res.status(200).json({ success: true, message: 'Already confirmed.' });
  }

  const mockPhonePeTxnId = `dev_phonepe_${Date.now()}`;
  const notes = {
    purpose:    purpose || (transaction.user ? 'event_registration' : 'membership'),
    guestEmail: guestEmail || transaction.guestEmail,
    guestName:  guestName  || transaction.guestName,
  };

  try {
    await handlePaymentSuccess(merchantTransactionId, mockPhonePeTxnId, { dev: true }, notes);
    res.status(200).json({ success: true, message: 'Dev confirmation successful.' });
  } catch (err) {
    console.error(`[DevConfirm] Error: ${err.message}`);
    return next(new AppError('Dev confirm failed. See server logs.', 500));
  }
});
