import express from 'express';
import { getMyVault, updateUserRole, updateMe, getTeamMembers } from '../controllers/user.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = express.Router();

// ── Public Routes ───────────────────────────────────────────────
router.get('/team', getTeamMembers);

// Apply protect middleware to all routes below
router.use(protect);

// ── Member Vault (History & Certificates) ─────────────────────
router.get('/me/vault', getMyVault);

// ── Update Own Profile ────────────────────────────────────────
router.patch('/me', updateMe);

// ── Role Update (Deprecated — use PATCH /api/admin/users/:id/role) ────
// Kept for backward compat. Will be removed in a future cleanup.
router.patch('/:id/role', restrictTo('admin'), updateUserRole);

export default router;

