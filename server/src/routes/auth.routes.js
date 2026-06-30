import { Router } from 'express';
import {
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// ── Rate Limiters ──────────────────────────────────────────────

/**
 * Strict limiter for login attempts — prevents brute-force credential stuffing.
 * 5 attempts per 5 minutes per IP. Returns a generic message.
 */
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 5 minutes.',
  },
});

/**
 * Moderate limiter for OTP-related routes.
 * Further debounce is enforced at the controller level (60s between sends).
 * 10 requests per 15 minutes per IP.
 */
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again later.',
  },
});

// ─────────────────────────────────────────────────────────────
// PUBLIC ROUTES (no JWT required)
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT.
 * Rate-limited: 5 attempts / 15 min per IP.
 */
router.post('/login', loginLimiter, login);

/**
 * POST /api/auth/forgot-password
 * Generates a 6-digit OTP and queues it to the user's email.
 * Always returns the same success response to prevent user enumeration.
 */
router.post('/forgot-password', otpLimiter, forgotPassword);

/**
 * POST /api/auth/reset-password
 * Verifies the OTP and sets a new password.
 * Returns a fresh JWT on success.
 */
router.post('/reset-password', otpLimiter, resetPassword);

// ─────────────────────────────────────────────────────────────
// PROTECTED ROUTES (JWT required via `protect` middleware)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 * Used by the frontend `useAuthStore.fetchProfile` on mount.
 */
router.get('/me', protect, getMe);

/**
 * POST /api/auth/change-password
 * Allows an authenticated user to change their password.
 * CRITICAL PATH: This is how new members clear their `requiresPasswordChange: true` flag.
 *
 * Note: `requirePasswordChange` middleware is intentionally NOT applied here —
 * this route must remain accessible to users who are in the forced-change state.
 */
router.post('/change-password', protect, changePassword);

export default router;
