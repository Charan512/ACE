import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import AppSettings from '../models/AppSettings.js';
import { emailQueue, certificateQueue } from '../queues/index.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';


/**
 * @desc    Get dashboard overview metrics
 * @route   GET /api/admin/stats
 * @access  Private (Admin / EBM / SBM)
 *
 * ZERO-REVENUE MANDATE: No financial metrics are exposed here.
 * Stats are strictly operational:
 *   1. Total Registered Accounts
 *   2. Total Verified Members (role = 'member')
 *   3. Active Events count
 */
export const getDashboardStats = catchAsync(async (req, res, _next) => {
  // 1. Total Registered Accounts
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
    activeJobs =
      (emailCounts.waiting || 0) +
      (emailCounts.active  || 0);
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
  const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 50);
  const skip  = (page - 1) * limit;

  const event = await Event.findById(eventId).select('title');
  if (!event) return next(new AppError('Event not found.', 404));

  const [registrations, total] = await Promise.all([
    Registration.find({ eventId })
      .populate('userId', 'name email aceId branch section year phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Registration.countDocuments({ eventId }),
  ]);

  res.status(200).json({
    success: true,
    event: { _id: event._id, title: event.title },
    count: registrations.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
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
 *   ?role=member | sbm | ebm | admin
 */
export const getAdminUsers = catchAsync(async (req, res, _next) => {
  const filter = {};
  if (req.query.role) {
    filter.role = req.query.role;
  }

  const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 50);
  const skip  = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -otp -history')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
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

  const validRoles = ['admin', 'ebm', 'sbm', 'member'];
  if (!validRoles.includes(role)) {
    return next(new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}.`, 400));
  }

  const user = await User.findById(id);
  if (!user) return next(new AppError('User not found.', 404));

  user.role = role;
  if (domain !== undefined) user.domain = domain;
  if (designation !== undefined) user.designation = designation;

  await user.save();

  // Strip sensitive fields before returning
  const sanitizedUser = user.toObject();
  delete sanitizedUser.password;
  delete sanitizedUser.otp;
  delete sanitizedUser.history;

  res.status(200).json({
    success: true,
    data: { user: sanitizedUser },
  });
});

// ─────────────────────────────────────────────────────────────
// CERTIFICATE MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Release certificates for a specific event.
 *
 * Two behaviours are triggered:
 *   1. Sets event.certificatesReleased = true
 *      → ACE Members who attended can now self-serve download from their dashboard.
 *        (GET /api/certificates/download/:eventId checks this flag before streaming)
 *
 *   2. Enqueues a BullMQ 'releaseCertificates' job
 *      → The certificateWorker picks up the job, renders a personalized PNG certificate
 *        for every confirmed GUEST registration (guestEmail != null), and emails it
 *        as an attachment via Resend. Guests have no login so email is the only channel.
 *
 * Idempotent: calling this endpoint a second time will NOT re-queue a new job.
 *   The $set: { certificatesReleased: true } is still applied (no-op), and a 409 is returned.
 *
 * @route   PATCH /api/admin/events/:id/release-certificates
 * @access  Private (Admin Only)
 */
export const releaseCertificates = catchAsync(async (req, res, next) => {
  const { id: eventId } = req.params;

  // ── 1. Load event ──────────────────────────────────────────
  const event = await Event.findById(eventId);
  if (!event) return next(new AppError('Event not found.', 404));

  // ── 2. Guard: certificate template must be configured ──────
  if (!event.certificateTemplate?.baseImageUrl) {
    return next(
      new AppError(
        'Cannot release certificates: this event has no certificate template configured.',
        422
      )
    );
  }

  // ── 3. Idempotency guard ───────────────────────────────────
  if (event.certificatesReleased) {
    return res.status(409).json({
      success: false,
      message: 'Certificates have already been released for this event.',
    });
  }

  // ── 4. Flip the flag — members can now self-serve ──────────
  event.certificatesReleased = true;
  await event.save();

  // ── 5. Count how many guests will receive an email ─────────
  const guestCount = await Registration.countDocuments({
    eventId,
    status:     'confirmed',
    guestEmail: { $ne: null },
  });

  // ── 6. Enqueue the batch email job for guests ──────────────
  // The certificateWorker will render + email each guest's certificate independently.
  // This is async — the admin gets a 200 immediately; delivery happens in the background.
  let jobId = null;
  if (guestCount > 0) {
    const job = await certificateQueue.add(
      'releaseCertificates',
      { eventId },
      {
        // Unique job key prevents duplicate enqueue on accidental double-click
        jobId: `cert-release-${eventId}`,
      }
    );
    jobId = job.id;
    console.log(
      `[Admin] Certificate release queued for event ${eventId} — ` +
      `job: ${jobId}, ${guestCount} guest emails pending.`
    );
  } else {
    console.log(
      `[Admin] Certificates released for event ${eventId} — no guest emails to send.`
    );
  }

  res.status(200).json({
    success: true,
    data: {
      eventId,
      certificatesReleased: true,
      guestEmailsPending:   guestCount,
      jobId,
      message:
        guestCount > 0
          ? `Certificates released. ${guestCount} guest(s) will receive their certificate by email shortly.`
          : 'Certificates released. ACE Members can now download from their dashboard.',
    },
  });
});

// ─────────────────────────────────────────────────────────────
// ATTENDANCE CSV EXPORT
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Stream a CSV file of all confirmed registrants for an event.
 *          Includes both members and guests. Each row reflects the current
 *          check-in state so the file can be exported post-event for records.
 *
 * @route   GET /api/admin/events/:eventId/attendance-csv
 * @access  Private (Admin / EBM / SBM)
 *
 * Columns:
 *   name | type (member/guest) | aceId | email | phone |
 *   paymentMethod | amount | checkedIn | checkedInAt
 */
export const getAttendanceCsv = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId).select('title');
  if (!event) return next(new AppError('Event not found.', 404));

  const registrations = await Registration.find({ eventId, status: 'confirmed' })
    .populate('userId', 'name email aceId phone')
    .populate('cashRegisteredBy', 'name role')
    .sort({ createdAt: 1 })
    .lean();

  // ── Build CSV rows ──────────────────────────────────────────
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    // Wrap in quotes if it contains comma, quote, or newline
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const headers = [
    'name', 'type', 'aceId', 'email', 'phone',
    'paymentMethod', 'amount (INR)', 'checkedIn', 'checkedInAt',
  ];

  const rows = registrations.map((reg) => {
    const isGuest = !reg.userId;
    return [
      isGuest ? reg.guestName   : reg.userId?.name,
      isGuest ? 'guest'         : 'member',
      isGuest ? ''              : (reg.userId?.aceId || ''),
      isGuest ? reg.guestEmail  : reg.userId?.email,
      isGuest ? (reg.phone || '') : (reg.userId?.phone || ''),
      reg.paymentMethod || 'online',
      reg.amount || 0,
      reg.checkedIn ? 'true' : 'false',
      reg.checkedInAt ? new Date(reg.checkedInAt).toISOString() : '',
    ].map(escape).join(',');
  });

  const csvBody = [headers.join(','), ...rows].join('\n');

  // Sanitise event title for use as filename
  const safeTitle = event.title.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  const filename  = `attendance_${safeTitle}_${eventId}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csvBody);
});

// ─────────────────────────────────────────────────────────────
// PAYMENT STATS
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Return online vs cash payment breakdown for a specific event.
 *          Useful for the admin dashboard payment stats chart.
 *
 * @route   GET /api/admin/events/:eventId/payment-stats
 * @access  Private (Admin / EBM / SBM)
 *
 * Response:
 *   {
 *     online: { count, totalAmountINR },
 *     cash:   { count, totalAmountINR },
 *     totals: { count, totalAmountINR }
 *   }
 */
export const getPaymentStats = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId).select('title');
  if (!event) return next(new AppError('Event not found.', 404));

  const stats = await Registration.aggregate([
    { $match: { eventId: event._id, status: 'confirmed' } },
    {
      $group: {
        _id:           '$paymentMethod',
        count:         { $sum: 1 },
        totalAmountINR: { $sum: '$amount' },
      },
    },
  ]);

  // Shape into a predictable object regardless of which methods exist
  const result = { online: { count: 0, totalAmountINR: 0 }, cash: { count: 0, totalAmountINR: 0 } };
  for (const row of stats) {
    if (row._id === 'online' || row._id === 'cash') {
      result[row._id] = { count: row.count, totalAmountINR: row.totalAmountINR };
    }
  }

  result.totals = {
    count:          result.online.count + result.cash.count,
    totalAmountINR: result.online.totalAmountINR + result.cash.totalAmountINR,
  };

  res.status(200).json({
    success: true,
    event: { _id: event._id, title: event.title },
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
// ADMIN NOTIFICATIONS
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Get paginated admin notifications (cash registration audit log).
 * @route   GET /api/admin/notifications
 * @access  Private (Admin Only)
 *
 * Query params:
 *   ?unreadOnly=true  → filter to unread notifications only
 *   ?page=1&limit=20
 */
export const getAdminNotifications = catchAsync(async (req, res, _next) => {
  const AdminNotification = (await import('../models/AdminNotification.js')).default;

  const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const skip  = (page - 1) * limit;

  const filter = {};
  if (req.query.unreadOnly === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    AdminNotification.find(filter)
      .populate('registeredBy', 'name role email')
      .populate('event', 'title eventDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AdminNotification.countDocuments(filter),
    AdminNotification.countDocuments({ isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    unreadCount,
    count: notifications.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: notifications,
  });
});

// ─────────────────────────────────────────────────────────────
// TREASURER ANALYTICS
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Get full financial + registration analytics for a single event
 * @route   GET /api/admin/treasurer/events/:eventId/stats
 * @access  Private (SBM with designation: 'Treasurer' ONLY)
 *
 * Runs 5 parallel aggregation pipelines against the Registration collection.
 * All amounts returned in INR (not paise).
 */
export const getTreasurerEventStats = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId)
    .select('title memberFee standardFee maxCapacity eventDate isActive')
    .lean();
  if (!event) return next(new AppError('Event not found.', 404));

  const confirmedFilter = { eventId, status: 'confirmed' };

  const [
    totalConfirmed,
    revenueAgg,
    byPaymentMethod,
    byTier,
    revenueByTier,
    overTime,
  ] = await Promise.all([
    // 1. Total confirmed registrations
    Registration.countDocuments(confirmedFilter),

    // 2. Total revenue (sum of amount field, stored in INR)
    Registration.aggregate([
      { $match: confirmedFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),

    // 3. Online vs Cash breakdown
    Registration.aggregate([
      { $match: confirmedFilter },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
    ]),

    // 4. Member vs Non-Member tier breakdown
    Registration.aggregate([
      { $match: confirmedFilter },
      { $group: { _id: '$tier', count: { $sum: 1 } } },
    ]),

    // 5. Revenue by tier
    Registration.aggregate([
      { $match: confirmedFilter },
      { $group: { _id: '$tier', revenue: { $sum: '$amount' } } },
    ]),

    // 6. Registrations over time (grouped by day)
    Registration.aggregate([
      { $match: confirmedFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ]),
  ]);

  // Normalise aggregation results into flat objects
  const paymentMethodMap = { online: 0, cash: 0 };
  byPaymentMethod.forEach(({ _id, count }) => { paymentMethodMap[_id] = count; });

  const tierMap = { member: 0, non_member: 0 };
  byTier.forEach(({ _id, count }) => { tierMap[_id] = count; });

  const revenueTierMap = { member: 0, non_member: 0 };
  revenueByTier.forEach(({ _id, revenue }) => { revenueTierMap[_id] = revenue; });

  const totalRevenueInr = revenueAgg[0]?.total ?? 0;
  const capacityUsedPercent = event.maxCapacity > 0
    ? parseFloat(((totalConfirmed / event.maxCapacity) * 100).toFixed(1))
    : 0;

  res.status(200).json({
    success: true,
    event: {
      _id: event._id,
      title: event.title,
      memberFee: event.memberFee,
      standardFee: event.standardFee,
      maxCapacity: event.maxCapacity,
      eventDate: event.eventDate,
      isActive: event.isActive,
    },
    stats: {
      totalConfirmedRegistrations: totalConfirmed,
      totalRevenueInr,
      capacityUsedPercent,
      byPaymentMethod: {
        online: paymentMethodMap.online,
        cash:   paymentMethodMap.cash,
      },
      byTier: {
        member:     tierMap.member,
        non_member: tierMap.non_member,
      },
      revenueByTier: {
        member:     revenueTierMap.member,
        non_member: revenueTierMap.non_member,
      },
      registrationsOverTime: overTime,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// APP SETTINGS (ADMIN ONLY)
// ─────────────────────────────────────────────────────────────

/**
 * @desc    Get global app settings (membership fee, email templates, cert template)
 * @route   GET /api/admin/settings
 * @access  Private (Admin Only)
 */
export const getAppSettings = catchAsync(async (req, res) => {
  const settings = await AppSettings.getSingleton();
  res.status(200).json({ success: true, data: settings });
});

/**
 * @desc    Update global app settings
 * @route   PATCH /api/admin/settings
 * @access  Private (Admin Only)
 *
 * Accepts partial updates — only the fields provided will be changed.
 * Supported fields:
 *   membershipFee                         → Number (INR)
 *   membershipConfirmationEmailTemplate   → { subject, body, isHtml }
 *   membershipCertificateTemplate         → { baseImageUrl, textFields: [...] }
 */
export const updateAppSettings = catchAsync(async (req, res, next) => {
  const {
    membershipFee,
    membershipConfirmationEmailTemplate,
    membershipCertificateTemplate,
  } = req.body;

  const updates = {};

  if (membershipFee !== undefined) {
    if (typeof membershipFee !== 'number' || membershipFee < 0) {
      return next(new AppError('membershipFee must be a non-negative number (INR).', 400));
    }
    updates.membershipFee = membershipFee;
  }

  if (membershipConfirmationEmailTemplate !== undefined) {
    updates.membershipConfirmationEmailTemplate = membershipConfirmationEmailTemplate;
  }

  if (membershipCertificateTemplate !== undefined) {
    updates.membershipCertificateTemplate = membershipCertificateTemplate;
  }

  if (Object.keys(updates).length === 0) {
    return next(new AppError('No valid fields provided for update.', 400));
  }

  const settings = await AppSettings.updateSingleton(updates);
  res.status(200).json({ success: true, data: settings });
});

