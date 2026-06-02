import express from 'express';
import {
  getDashboardStats,
  getAdminEvents,
  getEventRegistrations,
  getAdminUsers,
  updateAdminUserRole,
} from '../controllers/admin.controller.js';
import {
  createEvent,
  updateEvent,
  toggleRegistration,
  deleteEvent,
} from '../controllers/event.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = express.Router();

// ── All admin routes require authentication ───────────────────
router.use(protect);

// ── Most admin actions are accessible to admin, ebm, and sbm ─
router.use(restrictTo('admin', 'ebm', 'sbm'));

// ── Dashboard ─────────────────────────────────────────────────
// GET /api/admin/stats
router.get('/stats', getDashboardStats);

// ── Event Management ──────────────────────────────────────────
// GET  /api/admin/events         → list all events (including inactive)
// POST /api/admin/events         → create a new event (admin, ebm, sbm)
router
  .route('/events')
  .get(getAdminEvents)
  .post(createEvent);

// PATCH /api/admin/events/:id          → partial update event details
// PATCH /api/admin/events/:id/toggle   → flip isActive status
router.patch('/events/:id', updateEvent);
router.patch('/events/:id/toggle', toggleRegistration);

// DELETE /api/admin/events/:id — Admin Only — cascades to registrations + transactions
router.delete(
  '/events/:id',
  restrictTo('admin'), // Extra guard — only full admins can permanently delete
  deleteEvent
);

// ── Registration Management ───────────────────────────────────
// GET /api/admin/registrations/:eventId → list all registrations for an event
router.get('/registrations/:eventId', getEventRegistrations);

// ── User Management ───────────────────────────────────────────
// GET /api/admin/users               → list all users (filterable by ?role=)
router.get('/users', getAdminUsers);

// PATCH /api/admin/users/:id/role    → promote/change user role (Admin Only)
router.patch(
  '/users/:id/role',
  restrictTo('admin'), // Extra guard — only admins can promote/demote
  updateAdminUserRole
);

export default router;
