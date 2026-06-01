import { Router } from 'express';
import {
  createOrder,
  createMembershipOrder,
  handleWebhook,
  verifyAndConfirm,
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
 * NOTE: This route MUST NOT have auth middleware — PhonePe calls it server-to-server.
 *     Security is handled entirely by X-VERIFY SHA256 signature verification inside the controller.
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

/**
 * GET /api/payments/verify/:merchantTransactionId
 * Securely verifies a PhonePe transaction by querying the Status API.
 * Called when the user returns to the PaymentCallback page.
 */
router.get('/verify/:merchantTransactionId', verifyAndConfirm);

/**
 * POST /api/payments/dev-confirm
 *
 * DEV ONLY — simulates PhonePe payment success.
 * NEVER exposed in production.
 */
if (process.env.NODE_ENV !== 'production') {
  const { devConfirm } = await import('../controllers/payment.controller.js');
  router.post('/dev-confirm', devConfirm);
}

export default router;
