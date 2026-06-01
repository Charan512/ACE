import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

/**
 * @desc    Get the current user's Member Vault (attended events & certs)
 * @route   GET /api/users/me/vault
 * @access  Private
 */
export const getMyVault = catchAsync(async (req, res, next) => {
  // `req.user` is attached by the `protect` middleware
  // We need to fetch the user again to deeply populate the attendedEvents references
  const user = await User.findById(req.user._id).populate({
    path: 'history.attendedEvents.event',
    // Include certificateTemplate and certificatesReleased so the frontend can derive hasCertificate
    // without an extra round-trip — used for the "Certificate not released" state.
    select: 'title description eventDate venue certificateTemplate certificatesReleased',
  });

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  // Map the populated history to a flat array of vault entries for the frontend
  const vault = user.history.attendedEvents.map((entry) => {
    // Derive hasCertificate: true only when the admin has configured a
    // certificate template with a valid base image URL AND the admin has dispatched them.
    const hasCertificate = !!(entry.event.certificateTemplate?.baseImageUrl && entry.event.certificatesReleased);
    return {
      _id: entry.event._id,
      title: entry.event.title,
      eventDate: entry.event.eventDate,
      venue: entry.event.venue,
      // Only expose the cert download URL when a template actually exists
      certificateUrl: hasCertificate
        ? `/api/certificates/download/${entry.event._id}`
        : null,
      hasCertificate,
      attendedAt: entry.attendedAt,
      transactionId: entry.transaction,
    };
  });

  res.status(200).json({
    success: true,
    data: vault,
  });
});

/**
 * @desc    Get all users with basic filtering (Admin Only)
 * @route   GET /api/users
 * @access  Private (Admin Only)
 */
export const getAllUsers = catchAsync(async (req, res, next) => {
  const filter = {};

  if (req.query.role) {
    filter.role = req.query.role;
  }

  const users = await User.find(filter).select('-password');

  res.status(200).json({
    success: true,
    data: { users },
  });
});

/**
 * @desc    Update a user's role (Admin Only)
 * @route   PATCH /api/users/:id/role
 * @access  Private (Admin Only)
 */
export const updateUserRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    return next(new AppError('Role is required.', 400));
  }

  // Validate against the canonical role enum
  const validRoles = ['admin', 'ebm', 'sbm', 'member', 'guest'];
  if (!validRoles.includes(role)) {
    return next(new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}.`, 400));
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * @desc    Update current user's profile info (e.g. collegeId, phone, branch, year)
 * @route   PATCH /api/users/me
 * @access  Private
 */
export const updateMe = catchAsync(async (req, res, next) => {
  const { collegeId, phone, branch, year, section, registrationNumber, domain, designation } = req.body;

  const updates = {};
  if (collegeId !== undefined) updates.collegeId = collegeId;
  if (phone !== undefined) updates.phone = phone;
  if (branch !== undefined) updates.branch = branch;
  if (year !== undefined) updates.year = year;
  if (section !== undefined) updates.section = section;
  if (registrationNumber !== undefined) updates.registrationNumber = registrationNumber;
  // Body member fields — only write if provided; don't overwrite with null if absent
  if (domain !== undefined) updates.domain = domain;
  if (designation !== undefined) updates.designation = designation;

  // Run Mongoose schema validation on updates
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  res.status(200).json({
    success: true,
    data: { user },
  });
});
