import { Router } from 'express';
import {
  createOrder,
  createMembershipOrder,
  handleWebhook,
} from '../controllers/payment.controller.js';
import { protect, requirePasswordChange } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// ── Rate limiter for order creation (prevent order-flooding abuse) ──
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many order requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/payments/webhook
 *
 * ⚠️  This route MUST NOT have auth middleware — Razorpay calls it server-to-server.
 *     Security is handled entirely by HMAC SHA256 signature verification inside the controller.
 *     express.raw() body parsing for this route is set in index.js BEFORE express.json().
 */
router.post('/webhook', handleWebhook);

/**
 * POST /api/payments/membership-order
 * Guest-accessible: Creates a Razorpay order for purchasing an ACE Membership.
 */
router.post('/membership-order', orderLimiter, createMembershipOrder);

// ─────────────────────────────────────────────────────────────
// PROTECTED ROUTES (JWT required)
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/payments/order
 * Creates a Razorpay order for event registration.
 * Authenticated users get member pricing; guests use the guest checkout flow.
 */
router.post('/order', protect, requirePasswordChange, orderLimiter, createOrder);

export default router;
