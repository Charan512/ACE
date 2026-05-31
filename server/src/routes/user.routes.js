import express from 'express';
import { getMyVault, getAllUsers, updateUserRole, updateMe } from '../controllers/user.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply protect middleware to all routes below
router.use(protect);

// User Vault (History & Certificates)
router.get('/me/vault', getMyVault);

// Update Profile
router.patch('/me', updateMe);

// Admin-only User CRUD
router.get('/', restrictTo('admin'), getAllUsers);
router.patch('/:id/role', restrictTo('admin'), updateUserRole);

export default router;
