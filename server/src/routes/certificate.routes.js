import { Router } from 'express';
import {
  downloadCertificate,
  previewCertificate,
} from '../controllers/certificate.controller.js';
import {
  protect,
  requirePasswordChange,
  restrictTo,
} from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// ── Rate limiter — certificate generation is CPU/memory intensive ──
// Prevents a single user from hammering the canvas renderer.
const certLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minute window
  max: 10,                 // max 10 certificate renders per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many certificate requests. Please wait a moment and try again.',
  },
});

// ─────────────────────────────────────────────────────────────
// PROTECTED ROUTES
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/certificates/download/:eventId
 *
 * Eligibility: user must have attended the event (checked inside controller).
 * Auth:        JWT required + no pending password change.
 * Rate limit:  10 req/min to protect canvas rendering resources.
 */
router.get(
  '/download/:eventId',
  protect,
  requirePasswordChange,
  certLimiter,
  downloadCertificate
);

/**
 * GET /api/certificates/preview/:eventId
 *
 * Admin/Body Member only — for Canvas Studio template verification.
 * Uses placeholder data, not a real user's info.
 */
router.get(
  '/preview/:eventId',
  protect,
  requirePasswordChange,
  restrictTo('admin', 'ebm', 'sbm'),
  certLimiter,
  previewCertificate
);

export default router;
