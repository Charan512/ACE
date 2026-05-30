import express from 'express';
import { getDashboardStats } from '../controllers/admin.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply protect and restrictTo('admin') to all statistics endpoints
router.use(protect);
router.use(restrictTo('admin'));

// GET /api/admin/stats
router.get('/stats', getDashboardStats);

export default router;
