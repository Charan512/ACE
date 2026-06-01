import { Router } from 'express';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  toggleRegistration,
} from '../controllers/event.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// ── Rate Limiter (Admin mutation routes) ───────────────────────
// Prevents automated event-creation abuse on the admin endpoints.
const adminMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

// ─────────────────────────────────────────────────────────────
// PUBLIC ROUTES — no auth required
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/events
 *
 * Public feed of all active events with open registration.
 * Admins and body_members (identified inside the controller via req.user)
 * receive the full unfiltered list including inactive events.
 *
 * Note: `protect` is NOT applied here so unauthenticated users can browse.
 * The controller reads `req.user` if present (set by protect when called on
 * protected sibling routes — here it will be undefined for guests, which is fine).
 */
router.get('/', getAllEvents);

/**
 * GET /api/events/:id
 *
 * Single event detail page — publicly accessible.
 * Inactive events return 404 for non-admins.
 */
router.get('/:id', getEventById);

// ─────────────────────────────────────────────────────────────
// PROTECTED ROUTES — JWT + Admin RBAC required
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/events
 *
 * Create a new event.
 * RBAC: admin only (body_member can view but not create events).
 * The slug is auto-generated from title by the Event model pre-save hook.
 */
router.post(
  '/',
  protect,
  restrictTo('admin', 'ebm', 'sbm'),
  adminMutationLimiter,
  createEvent
);

/**
 * PATCH /api/events/:id
 *
 * Partially update an event's fields.
 * RBAC: admin only. `registeredCount` and `createdBy` are blocked by the
 * `sanitizeEventUpdate` helper inside the controller.
 */
router.patch(
  '/:id',
  protect,
  restrictTo('admin', 'ebm', 'sbm'),
  adminMutationLimiter,
  updateEvent
);

/**
 * PATCH /api/events/:id/toggle
 *
 * Atomically flips `isActive` to open or close ticket sales.
 * RBAC: admin only.
 *
 * NOTE: Route order matters: this MUST be registered before `/:id` would
 * match it as a plain ID. Express matches routes in declaration order,
 * and /:id comes AFTER /:id/toggle here, so there is no conflict.
 */
router.patch(
  '/:id/toggle',
  protect,
  restrictTo('admin', 'ebm', 'sbm'),
  adminMutationLimiter,
  toggleRegistration
);

export default router;
