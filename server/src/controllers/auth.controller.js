import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { emailQueue } from '../queues/index.js';

// ─────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Signs a JWT for the given user ID.
 *
 * @param {string} userId - MongoDB ObjectId string
 * @returns {string} Signed JWT
 */
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Builds and sends the standard auth response payload.
 * Strips sensitive fields before sending the user object.
 *
 * @param {Object}   user     - Mongoose User document
 * @param {number}   statusCode
 * @param {Object}   res      - Express response
 */
const sendAuthResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Strip fields that must never leave the server
  const userPayload = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    aceId: user.aceId ?? null,
    requiresPasswordChange: user.requiresPasswordChange,
    isEmailVerified: user.isEmailVerified,
    branch: user.branch ?? null,
    year: user.year ?? null,
    profilePhoto: user.profilePhoto ?? null,
    createdAt: user.createdAt,
  };

  res.status(statusCode).json({
    success: true,
    token,
    data: { user: userPayload },
  });
};

// ─────────────────────────────────────────────────────────────
// PUBLIC CONTROLLERS
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email + password.
 * Returns a JWT and the sanitized user object on success.
 *
 * Security notes:
 *  - `password` field has `select: false` in schema — must be explicitly selected.
 *  - Uses bcrypt.compare (constant-time) — no timing-safe concern here since
 *    we always run the comparison even when the user is not found (dummy compare).
 *  - Returns a generic 401 for both "user not found" and "wrong password"
 *    to prevent user enumeration.
 */
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // ── 1. Validate input presence ─────────────────────────────
  if (!email || !password) {
    return next(new AppError('Please provide both email and password.', 400));
  }

  // ── 2. Fetch user — explicitly select password (select: false in schema) ─
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    '+password +requiresPasswordChange'
  );

  // ── 3. Verify credentials ──────────────────────────────────
  // Run bcrypt.compare even if user doesn't exist to prevent timing attacks
  // that could enumerate valid email addresses.
  const dummyHash = '$2b$12$invalidhashfortimingprotectiononly000000000000000000';
  const passwordHash = user?.password ?? dummyHash;
  const isPasswordCorrect = await bcrypt.compare(password, passwordHash);

  if (!user || !isPasswordCorrect) {
    return next(new AppError('Invalid email or password.', 401));
  }

  // ── 4. Issue JWT ───────────────────────────────────────────
  sendAuthResponse(user, 200, res);
});

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile.
 * `req.user` is populated by the `protect` middleware — no DB call needed.
 */
export const getMe = catchAsync(async (req, res, _next) => {
  // Re-fetch to get the latest profile data (protect middleware fetches a lean copy)
  const user = await User.findById(req.user._id).select('-otp');

  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * POST /api/auth/change-password
 *
 * Allows an authenticated user to change their password.
 * This is the MANDATORY flow for new users flagged with `requiresPasswordChange: true`.
 *
 * On success:
 *  - `requiresPasswordChange` is set to `false`
 *  - A fresh JWT is returned (invalidates all previous sessions effectively)
 */
export const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Both currentPassword and newPassword are required.', 400));
  }

  if (newPassword.length < 8) {
    return next(new AppError('New password must be at least 8 characters long.', 400));
  }

  // ── 1. Fetch user with password (select: false by default) ─
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  // ── 2. Verify current password ────────────────────────────
  const isCurrentPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordCorrect) {
    return next(new AppError('Your current password is incorrect.', 401));
  }

  // ── 3. Prevent reuse of the same password ─────────────────
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    return next(new AppError('New password cannot be the same as your current password.', 400));
  }

  // ── 4. Update password — pre-save hook handles bcrypt hashing ─
  user.password = newPassword;
  user.requiresPasswordChange = false; // ← CRITICAL: clear the forced-change flag
  await user.save();

  // ── 5. Return fresh JWT ────────────────────────────────────
  sendAuthResponse(user, 200, res);
});

/**
 * POST /api/auth/forgot-password
 *
 * Initiates the OTP-based password reset flow.
 *
 * Security:
 *  - Always returns the same success message regardless of whether the email
 *    exists — prevents user enumeration.
 *  - OTP is stored as a bcrypt hash (salt rounds: 10) — not reversible.
 *  - 60-second debounce: rejects a new OTP request if the last one was sent
 *    within OTP_DEBOUNCE_SECONDS (default: 60s).
 *  - OTP expires in OTP_EXPIRY_MINUTES (default: 10 minutes).
 */
export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Please provide your email address.', 400));
  }

  const genericSuccess = () =>
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, an OTP has been sent.',
    });

  // ── 1. Find user — silent fail to prevent enumeration ─────
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return genericSuccess();

  // ── 2. 60-second debounce rate limit ──────────────────────
  const debounceSeconds = parseInt(process.env.OTP_DEBOUNCE_SECONDS, 10) || 60;
  if (user.otp?.lastSentAt) {
    const secondsSinceLast = (Date.now() - new Date(user.otp.lastSentAt).getTime()) / 1000;
    if (secondsSinceLast < debounceSeconds) {
      const retryAfter = Math.ceil(debounceSeconds - secondsSinceLast);
      return next(
        new AppError(
          `Please wait ${retryAfter} second(s) before requesting another OTP.`,
          429
        )
      );
    }
  }

  // ── 3. Generate a 6-digit CSPRNG OTP ─────────────────────
  // crypto.randomInt is CSPRNG — suitable for security-sensitive codes.
  const rawOtp = crypto.randomInt(100_000, 999_999).toString();

  // ── 4. Hash the OTP for storage (never store raw OTPs) ────
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(rawOtp, salt);

  // ── 5. Persist OTP state to user document ─────────────────
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10;
  user.otp = {
    code: hashedOtp,
    expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
    lastSentAt: new Date(),
  };
  await user.save({ validateBeforeSave: false });

  // ── 6. Enqueue OTP email via BullMQ (never use setTimeout) ─
  await emailQueue.add('otpEmail', {
    email: user.email,
    otp: rawOtp, // Worker embeds raw OTP into email body
  });

  console.log(`[AuthController] OTP queued for ${user.email}. Expires in ${expiryMinutes}min.`);

  return genericSuccess();
});

/**
 * POST /api/auth/reset-password
 *
 * Verifies the 6-digit OTP and resets the user's password.
 *
 * Validation chain:
 *  1. User must exist with a non-expired OTP record.
 *  2. Provided OTP must match the stored bcrypt hash.
 *  3. New password must meet minimum length requirement.
 *
 * On success:
 *  - Password is updated (pre-save hook hashes it).
 *  - OTP fields are cleared from the user document.
 *  - `requiresPasswordChange` is set to `false`.
 *  - A fresh JWT is returned so the user is immediately authenticated.
 */
export const resetPassword = catchAsync(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return next(new AppError('Email, OTP, and new password are all required.', 400));
  }

  if (newPassword.length < 8) {
    return next(new AppError('New password must be at least 8 characters long.', 400));
  }

  // ── 1. Find user with a valid (non-expired) OTP ───────────
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    'otp.expiresAt': { $gt: new Date() }, // OTP must not be expired
  }).select('+password');

  if (!user || !user.otp?.code) {
    return next(
      new AppError('OTP is invalid or has expired. Please request a new one.', 400)
    );
  }

  // ── 2. Verify OTP against stored hash ─────────────────────
  const isOtpValid = await bcrypt.compare(otp.toString(), user.otp.code);
  if (!isOtpValid) {
    return next(new AppError('OTP is incorrect. Please check and try again.', 400));
  }

  // ── 3. Apply new password — pre-save hook bcrypts it ──────
  user.password = newPassword;
  user.requiresPasswordChange = false;

  // ── 4. Atomically clear OTP fields ────────────────────────
  user.otp = undefined;

  await user.save();

  console.log(`[AuthController] Password reset successful for ${user.email}.`);

  // ── 5. Issue fresh JWT — user is now fully authenticated ──
  sendAuthResponse(user, 200, res);
});
