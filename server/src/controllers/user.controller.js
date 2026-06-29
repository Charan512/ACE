import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

/**
 * @desc    Get the current user's Member Vault (attended events & certs)
 * @route   GET /api/users/me/vault
 * @access  Private
 */
export const getMyVault = catchAsync(async (req, res, next) => {
  // SBMs and EBMs do not have a Member Vault — history is stripped from their schema.
  // Return an empty vault immediately instead of crashing on undefined history.
  const rolesWithVault = ['member'];
  if (!rolesWithVault.includes(req.user.role)) {
    return res.status(200).json({
      success: true,
      data: [],
      message: 'Member Vault is only available for ACE Members.',
    });
  }

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
  const vault = (user.history?.attendedEvents || []).map((entry) => {
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
 * @desc    Update a user's role (Admin Only)
 * @route   PATCH /api/users/:id/role
 * @access  Private (Admin Only)
 *
 * @deprecated Use PATCH /api/admin/users/:id/role instead — it handles
 * domain, designation, and properly enforces the role firewall.
 * This endpoint is kept for backward compatibility only.
 */
export const updateUserRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    return next(new AppError('Role is required.', 400));
  }

  // Validate against the current canonical role enum (guest removed)
  const validRoles = ['admin', 'sbm', 'ebm', 'member'];
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
  const { phone, branch, year, section, registrationNumber, domain, designation, avatarUrl } = req.body;

  const updates = {};
  if (phone !== undefined) updates.phone = phone;
  if (branch !== undefined) updates.branch = branch;
  if (year !== undefined) updates.year = year;
  if (section !== undefined) updates.section = section;
  if (registrationNumber !== undefined) updates.registrationNumber = registrationNumber;
  if (domain !== undefined) updates.domain = domain;
  if (designation !== undefined) updates.designation = designation;
  // Avatar URL set after a successful direct-to-R2 upload from the client
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

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
