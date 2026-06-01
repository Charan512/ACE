import express from 'express';
import {
  getOpsEvents,
  getRoster,
  checkIn,
  verifyMember,
} from '../controllers/ops.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = express.Router();

// ── All ops routes require authentication ─────────────────────
router.use(protect);
router.use(restrictTo('admin', 'ebm', 'sbm'));

// ── Events ───────────────────────────────────────────────────
// GET /api/ops/events          → active events for dashboard
router.get('/events', getOpsEvents);

// ── Event Control Room ───────────────────────────────────────
// GET /api/ops/events/:eventId/roster → full roster + stats
router.get('/events/:eventId/roster', getRoster);

// PUT /api/ops/events/:eventId/checkin → check in a registrant
router.put('/events/:eventId/checkin', checkIn);

// ── Member Verification (read-only) ──────────────────────────
// GET /api/ops/verify/:scannedId → verify ACE ID or userId
router.get('/verify/:scannedId', verifyMember);

export default router;
