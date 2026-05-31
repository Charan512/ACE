import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { emailQueue, treasurerQueue } from '../queues/index.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

/**
 * @desc    Get dashboard overview metrics
 * @route   GET /api/admin/stats
 * @access  Private (Admin / EBM / SBM)
 *
 * ZERO-REVENUE MANDATE: No financial metrics are exposed here.
 * Stats are strictly operational:
 *   1. Total Registered Accounts (all non-guest users)
 *   2. Total Verified Members (role = 'member')
 *   3. Active Events count
 */
export const getDashboardStats = catchAsync(async (req, res, _next) => {
  // 1. Total Registered Accounts: all users with a real role (exclude guests)
  const totalAccounts = await User.countDocuments({
    role: { $in: ['admin', 'ebm', 'sbm', 'member'] },
  });

  // 2. Total Verified Members: users with role 'member' specifically
  const totalVerifiedMembers = await User.countDocuments({ role: 'member' });

  // 3. Active Events: events flagged as isActive: true
  const activeEvents = await Event.countDocuments({ isActive: true });

  // 4. Active Queue Jobs: operational metric (not financial)
  let activeJobs = 0;
  try {
    const emailCounts = await emailQueue.getJobCounts('waiting', 'active');
    const treasurerCounts = await treasurerQueue.getJobCounts('waiting', 'active');
    activeJobs =
      (emailCounts.waiting || 0) +
      (emailCounts.active || 0) +
      (treasurerCounts.waiting || 0) +
      (treasurerCounts.active || 0);
  } catch (error) {
    console.error('[AdminStats] Failed to retrieve BullMQ job counts:', error.message);
    // Graceful fallback — don't fail the whole stats request
  }

  res.status(200).json({
    success: true,
    data: {
      totalAccounts,
      totalVerifiedMembers,
      activeEvents,
      activeJobs,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// EVENT MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Get all events (admin view — includes inactive)
 * @route   GET /api/admin/events
 * @access  Private (Admin / EBM / SBM)
 */
export const getAdminEvents = catchAsync(async (req, res, _next) => {
  const events = await Event.find({})
    .populate('createdBy', 'name aceId role')
    .sort({ eventDate: -1 });

  const serialized = events.map((ev) => ev.toObject({ virtuals: true }));

  res.status(200).json({
    success: true,
    count: serialized.length,
    data: serialized,
  });
});

/**
 * @desc    Toggle event live/inactive status
 * @route   PATCH /api/admin/events/:id/toggle
 * @access  Private (Admin / EBM / SBM)
 */
export const toggleEventStatus = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  if (!event) return next(new AppError('Event not found.', 404));

  const updated = await Event.findByIdAndUpdate(
    req.params.id,
    { $set: { isActive: !event.isActive } },
    { new: true, runValidators: true }
  ).populate('createdBy', 'name aceId role');

  const state = updated.isActive ? 'LIVE' : 'INACTIVE';
  console.log(`[AdminController] Event "${updated.title}" set to ${state} by ${req.user.aceId}`);

  res.status(200).json({
    success: true,
    message: `Event is now ${state}.`,
    data: updated.toObject({ virtuals: true }),
  });
});

// ─────────────────────────────────────────────────────────────
// REGISTRATION MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Get all registrations for a specific event
 * @route   GET /api/admin/registrations/:eventId
 * @access  Private (Admin / EBM / SBM)
 */
export const getEventRegistrations = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId).select('title');
  if (!event) return next(new AppError('Event not found.', 404));

  const registrations = await Registration.find({ eventId })
    .populate('userId', 'name email aceId branch section year phone')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    event: { _id: event._id, title: event.title },
    count: registrations.length,
    data: registrations,
  });
});

// ─────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Get all users with optional role filtering
 * @route   GET /api/admin/users
 * @access  Private (Admin / EBM / SBM)
 *
 * Query params:
 *   ?role=member | sbm | ebm | admin | guest
 */
export const getAdminUsers = catchAsync(async (req, res, _next) => {
  const filter = {};
  if (req.query.role) {
    filter.role = req.query.role;
  }

  const users = await User.find(filter)
    .select('-password -otp -history')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    data: { users },
  });
});

/**
 * @desc    Update a user's role (Admin Only — SBMs/EBMs cannot promote)
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private (Admin Only)
 */
export const updateAdminUserRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role, domain, designation } = req.body;

  if (!role) return next(new AppError('Role is required.', 400));

  const validRoles = ['admin', 'ebm', 'sbm', 'member', 'guest'];
  if (!validRoles.includes(role)) {
    return next(new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}.`, 400));
  }

  const updates = { role };
  // Allow domain/designation to be set alongside role change for body members
  if (domain !== undefined) updates.domain = domain;
  if (designation !== undefined) updates.designation = designation;

  const user = await User.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password -otp -history');

  if (!user) return next(new AppError('User not found.', 404));

  res.status(200).json({
    success: true,
    data: { user },
  });
});
