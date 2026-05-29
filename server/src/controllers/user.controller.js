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
    select: 'title description eventDate location',
  });

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  // Map the populated history to a flat array of vault entries for the frontend
  const vault = user.history.attendedEvents.map(entry => ({
    _id: entry.event._id,
    title: entry.event.title,
    eventDate: entry.event.eventDate,
    location: entry.event.location,
    certificateUrl: `/api/certificates/${entry.event._id}?userId=${user._id}`,
    attendedAt: entry.attendedAt,
    transactionId: entry.transaction,
  }));

  res.status(200).json({
    success: true,
    data: vault,
  });
});
