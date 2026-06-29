import express from 'express';
import {
  getDashboardStats,
  getAdminEvents,
  getEventRegistrations,
  getAdminUsers,
  updateAdminUserRole,
  releaseCertificates,
  getAttendanceCsv,
  getPaymentStats,
  getAdminNotifications,
  getTreasurerEventStats,
} from '../controllers/admin.controller.js';
import {
  createEvent,
  updateEvent,
  toggleRegistration,
  deleteEvent,
  publishEvent,
} from '../controllers/event.controller.js';
import { protect, restrictTo, requiresTreasurer } from '../middleware/auth.middleware.js';

const router = express.Router();

// ── All admin routes require authentication ────────────────────
router.use(protect);

// ── Routes below are accessible to admin + sbm + ebm ──────────
router.use(restrictTo('admin', 'ebm', 'sbm'));

// ── Dashboard — Admin Only ────────────────────────────────────
// SBMs and EBMs do not need system-level stats.
router.get('/stats', restrictTo('admin'), getDashboardStats);

// ── Event Read (Admin + SBM + EBM) ────────────────────────────
// SBM/EBM can see all events (incl. drafts) for the ops panel.
// This is the only admin-prefix read endpoint they can access.
router.get('/events', getAdminEvents);

// ── Event Mutation (Admin Only) ────────────────────────────────
// SBMs and EBMs must NOT create, edit, publish, or delete events.
router.post(
  '/events',
  restrictTo('admin'),          // Extra guard — SBM/EBM cannot create
  createEvent
);

router.patch(
  '/events/:id',
  restrictTo('admin'),          // Extra guard — SBM/EBM cannot edit
  updateEvent
);

// Toggle isActive (registration open/closed) — Admin Only
router.patch(
  '/events/:id/toggle',
  restrictTo('admin'),
  toggleRegistration
);

// Publish: transition draft → published — Admin Only
router.patch(
  '/events/:id/publish',
  restrictTo('admin'),
  publishEvent
);

// Delete event (cascades to registrations + transactions) — Admin Only
router.delete(
  '/events/:id',
  restrictTo('admin'),
  deleteEvent
);

// ── Registration Management ───────────────────────────────────
// Roster read is kept for SBM/EBM — they need it for the Ops Portal.
router.get('/registrations/:eventId', getEventRegistrations);

// Attendance CSV export — Admin Only
// Only the admin should be able to download raw attendance data.
router.get(
  '/events/:eventId/attendance-csv',
  restrictTo('admin'),
  getAttendanceCsv
);

// Payment stats — Admin Only
router.get(
  '/events/:eventId/payment-stats',
  restrictTo('admin'),
  getPaymentStats
);

// ── User Management — Admin Only ──────────────────────────────
// SBMs and EBMs do not need to browse the user list.
router.get('/users', restrictTo('admin'), getAdminUsers);

// Role promotion/demotion — Admin Only
router.patch(
  '/users/:id/role',
  restrictTo('admin'),
  updateAdminUserRole
);

// ── Certificate Management ────────────────────────────────────
router.patch(
  '/events/:id/release-certificates',
  restrictTo('admin'),
  releaseCertificates
);

// ── Admin Notifications (cash reg log) ────────────────────────
router.get(
  '/notifications',
  restrictTo('admin'),
  getAdminNotifications
);

// ── Treasurer Analytics (SBM + Treasurer designation ONLY) ───
router.get(
  '/treasurer/events/:eventId/stats',
  restrictTo('sbm'),
  requiresTreasurer,
  getTreasurerEventStats
);

export default router;

