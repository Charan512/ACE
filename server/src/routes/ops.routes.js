import express from 'express';
import {
  getOpsEvents,
  getRoster,
  checkIn,
  verifyMember,
} from '../controllers/ops.controller.js';
import {
  cashRegisterMember,
  cashRegisterGuest,
} from '../controllers/cashRegistration.controller.js';
import { cashRegisterMembership } from '../controllers/cashMembership.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';


const router = express.Router();

// ── All ops routes require authentication ─────────────────────
router.use(protect);
router.use(restrictTo('admin', 'ebm', 'sbm'));

// ── Events ───────────────────────────────────────────────────
router.get('/events', getOpsEvents);

// ── Event Control Room ───────────────────────────────────────
router.get('/events/:eventId/roster', getRoster);
router.put('/events/:eventId/checkin', checkIn);

// ── Cash Registration (in-person walk-in / cash payment) ─────
// POST /api/ops/events/:eventId/cash-register/member
//   → Search by aceId or phone, create confirmed Registration, paymentMethod: cash
router.post('/events/:eventId/cash-register/member', cashRegisterMember);

// POST /api/ops/events/:eventId/cash-register/guest
//   → Fill event's custom form on behalf of guest, create confirmed Registration,
//     paymentMethod: cash, and email QR to guest
router.post('/events/:eventId/cash-register/guest', cashRegisterGuest);

// ── Member Verification (read-only) ──────────────────────────
router.get('/verify/:scannedId', verifyMember);

// ── Cash Membership Registration ─────────────────────────────
// POST /api/ops/cash-membership
//   → EBM/SBM registers a walk-in applicant as a new ACE member (cash payment).
//     Reads membership fee from AppSettings. Sends credentials + confirmation email.
//     Creates AdminNotification of type 'cash_membership'.
router.post('/cash-membership', cashRegisterMembership);

export default router;

