import mongoose from 'mongoose';
import User from '../models/User.js';
import AppSettings from '../models/AppSettings.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import generateTempPassword from '../utils/generatePassword.js';
import { emailQueue } from '../queues/index.js';

/**
 * Helper: create an AdminNotification for a cash membership registration.
 * Dynamically imported to avoid circular dependency issues.
 */
const createMembershipNotification = async (payload) => {
  const AdminNotification = (await import('../models/AdminNotification.js')).default;
  await AdminNotification.create(payload);
};

// ─────────────────────────────────────────────────────────────
// CASH MEMBERSHIP REGISTRATION
// ─────────────────────────────────────────────────────────────

/**
 * @desc    EBM/SBM registers a new ACE member in-person with cash payment.
 *          Uses the same form schema as the online self-registration flow.
 *          Reads membership fee from AppSettings (DB) — never hardcoded.
 *
 * @route   POST /api/ops/cash-membership
 * @access  Private (SBM / EBM)
 *
 * Body:
 *   {
 *     name:         string (required)
 *     email:        string (required)
 *     phone?:       string
 *     gender?:      string
 *     branch?:      string
 *     year?:        string
 *     collegeId?:   string
 *     studentType?: 'regular' | 'lateral'  (defaults to 'regular')
 *   }
 *
 * On success:
 *   1. Creates User document with role 'member', temp password, requiresPasswordChange: true
 *   2. Enqueues welcomeEmail (credentials)
 *   3. Enqueues membershipConfirmationEmail (admin-configured body + cert attachment)
 *   4. Creates AdminNotification of type 'cash_membership'
 *   5. Returns the new user's aceId + membership fee charged
 */
export const cashRegisterMembership = catchAsync(async (req, res, next) => {
  const { name, email, phone, branch, year, studentType } = req.body;

  if (!name || !email) {
    return next(new AppError('name and email are required for membership registration.', 400));
  }

  // ── 1. Check for existing account ─────────────────────────
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return next(
      new AppError(
        `An ACE membership already exists for ${email}. Their ACE ID is ${existing.aceId || '(pending)'}`,
        409
      )
    );
  }

  // ── 2. Read membership fee from AppSettings ───────────────
  const settings    = await AppSettings.getSingleton();
  const membershipFee = settings.membershipFee;

  // ── 3. Create the User in an atomic session ───────────────
  const session = await mongoose.startSession();
  session.startTransaction();

  let newUser;
  let aceId;
  let tempPassword;

  try {
    aceId        = await User.generateAceId();
    tempPassword = generateTempPassword();

    [newUser] = await User.create(
      [
        {
          name:                    name.trim(),
          email:                   email.toLowerCase().trim(),
          password:                tempPassword, // pre-save hook bcrypts this
          aceId,
          role:                    'member',
          requiresPasswordChange:  true,
          phone:                   phone       || undefined,
          branch:                  branch      || undefined,
          year:                    year        ? Number(year) : undefined,
          studentType:             studentType || 'regular',
          // Track that this membership was registered via cash by ops staff
          membershipPaymentMethod: 'cash',
          membershipRegisteredBy:  req.user._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  // ── 4. Enqueue emails ─────────────────────────────────────
  // Welcome email: temporary password + forced-change notice
  await emailQueue.add('welcomeEmail', {
    userId:      newUser._id.toString(),
    aceId,
    tempPassword,
  });

  // Confirmation email: admin-configured body + membership certificate attachment
  await emailQueue.add('membershipConfirmationEmail', {
    userId:  newUser._id.toString(),
    aceId,
    feePaid: membershipFee,
  });

  // ── 5. Create admin audit notification ────────────────────
  await createMembershipNotification({
    type:             'cash_membership',
    event:            null,        // Not event-related
    eventTitle:       null,
    registrant:       { name: newUser.name, email: newUser.email, aceId, type: 'member' },
    registeredBy:     req.user._id,
    registeredByName: req.user.name,
    registeredByRole: req.user.role,
    amount:           membershipFee,
    paymentMethod:    'cash',
  });

  console.log(
    `[CashMembership] ${req.user.role.toUpperCase()} ${req.user.email} ` +
    `cash-registered new member ${aceId} (${newUser.email})`
  );

  res.status(201).json({
    success: true,
    message: `${newUser.name} has been registered as ACE Member ${aceId}. ` +
             `Credentials and confirmation email sent to ${newUser.email}.`,
    data: {
      aceId,
      name:          newUser.name,
      email:         newUser.email,
      membershipFee,
      paymentMethod: 'cash',
    },
  });
});
