import express from 'express';
import { getMyVault, updateMe, getTeamMembers } from '../controllers/user.controller.js';
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

export default router;

