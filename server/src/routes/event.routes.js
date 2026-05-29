import express from 'express';
import { getAllEvents, createEvent } from '../controllers/event.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route for Guest Portal & Member Dashboard
router.route('/').get(getAllEvents);

// Protected Admin route for Command Center
router.route('/').post(protect, restrictTo('admin', 'body_member'), createEvent);

export default router;
