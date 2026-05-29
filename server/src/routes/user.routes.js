import express from 'express';
import { getMyVault } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply protect middleware to all routes below
router.use(protect);

// User Vault (History & Certificates)
router.get('/me/vault', getMyVault);

export default router;
