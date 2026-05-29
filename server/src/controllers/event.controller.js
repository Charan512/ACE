import Event from '../models/Event.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

/**
 * @desc    Get all upcoming events
 * @route   GET /api/events
 * @access  Public
 */
export const getAllEvents = catchAsync(async (req, res, next) => {
  // Return upcoming events (or all for now, sorted by date)
  const events = await Event.find().sort({ eventDate: 1 });

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  });
});

/**
 * @desc    Create a new event
 * @route   POST /api/events
 * @access  Private/Admin
 */
export const createEvent = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    eventDate,
    venue,
    memberFee,
    nonMemberFee,
    tags,
    isRegistrationOpen,
    certificateTemplate,
  } = req.body;

  if (!title || !eventDate || !venue) {
    return next(new AppError('Please provide title, eventDate, and venue.', 400));
  }

  const newEvent = await Event.create({
    title,
    description,
    eventDate,
    venue,
    memberFee,
    nonMemberFee,
    tags,
    isRegistrationOpen,
    certificateTemplate, // Handles R2 base image and x/y percentages
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: newEvent,
  });
});
