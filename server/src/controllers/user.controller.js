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
    select: 'title description eventDate venue certificateTemplate certificatesReleased resources',
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
      resources:     (entry.event.resources || []),
      hasResources:  !!(entry.event.resources?.length > 0),
      attendedAt:    entry.attendedAt,
      transactionId: entry.transaction,
    };
  });

  res.status(200).json({
    success: true,
    data: vault,
  });
});


/**
 * @desc    Update current user's profile info (e.g. collegeId, phone, branch, year)
 * @route   PATCH /api/users/me
 * @access  Private
 */
export const updateMe = catchAsync(async (req, res, next) => {
  // NOTE: These fields are intentionally excluded from self-service updates:
  //   • domain        — SBM/EBM-only; set by admin via role promotion
  //   • designation   — e.g. 'Treasurer'; set by admin only. Allowing self-write
  //                     would let any SBM escalate their own Treasurer access.
  //   • registrationNumber — set at membership creation; should not change
  //   • role, aceId, email — never self-writable
  const { name, phone, branch, year, section, gender, profilePhoto, linkedin, personalEmail } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (branch !== undefined) updates.branch = branch;
  if (year !== undefined) updates.year = year;
  if (section !== undefined) updates.section = section;
  if (gender !== undefined) updates.gender = gender;
  if (profilePhoto !== undefined) updates.profilePhoto = profilePhoto;
  if (linkedin !== undefined) updates.linkedin = linkedin;
  if (personalEmail !== undefined) updates.personalEmail = personalEmail;

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

/**
 * @desc    Get all EBMs and SBMs for the public team directory
 * @route   GET /api/users/team
 * @access  Public
 */
export const getTeamMembers = catchAsync(async (req, res, next) => {
  const team = await User.find({ role: { $in: ['ebm', 'sbm'] } })
    .select('name role branch domain designation profilePhoto linkedin personalEmail email')
    .sort({ role: 1, name: 1 }); // Sort by role, then name

  res.status(200).json({
    success: true,
    data: { team },
  });
});
