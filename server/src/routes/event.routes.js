import { Router } from 'express';
import { getAllEvents, getEventById } from '../controllers/event.controller.js';

const router = Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC ROUTES — no auth required
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/events
 *
 * Public feed of all published events with open registration.
 * Non-authenticated users (guests, visitors) can browse freely.
 * The controller reads req.user if present to determine visibility:
 *   - Non-authenticated / member → only published events with open registration
 *   - Admin / SBM / EBM          → all events including drafts (use /api/admin/events instead)
 *
 * NOTE: Mutations (create, edit, toggle, publish, delete) are admin-only
 * and live exclusively under /api/admin/events with strict RBAC.
 */
router.get('/', getAllEvents);

/**
 * GET /api/events/:id
 *
 * Single event detail — publicly accessible.
 * Draft events return 404 for non-admins.
 */
router.get('/:id', getEventById);

export default router;

