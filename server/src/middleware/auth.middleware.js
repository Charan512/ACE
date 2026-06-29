import jwt from 'jsonwebtoken';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import User from '../models/User.js';

/**
 * Protects routes that require a valid JWT session.
 *
 * Flow:
 *  1. Extract Bearer token from Authorization header
 *  2. Verify JWT signature and expiry
 *  3. Fetch the user document (ensures account still exists)
 *  4. Attach user to req.user for downstream controllers
 */
export const protect = catchAsync(async (req, _res, next) => {
  // 1. Extract token
  const authHeader = req.headers.authorization;
  let token;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[AUTH DEBUG] No token provided in headers.');
    }
    return next(new AppError('You are not logged in. Please authenticate.', 401));
  }

  // 2. Verify signature and expiry
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[AUTH DEBUG] JWT Verify Error:', err.name, err.message);
    }
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid token. Please log in again.', 401));
  }

  // 3. Confirm user still exists (account may have been deleted after token was issued)
  const currentUser = await User.findById(decoded.id).select('+requiresPasswordChange');
  if (!currentUser) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[AUTH DEBUG] User not found for id:', decoded.id);
    }
    return next(new AppError('The account belonging to this token no longer exists.', 401));
  }

  // 4. Attach to request
  req.user = currentUser;
  next();
});

/**
 * Intercepts users who have a forced password change pending.
 * Must be used AFTER `protect`.
 * Allows pass-through only for the change-password route itself.
 */
export const requirePasswordChange = (req, _res, next) => {
  if (req.user.requiresPasswordChange) {
    return next(
      new AppError(
        'You must change your temporary password before accessing this resource.',
        403
      )
    );
  }
  next();
};

/**
 * Restricts access to specific roles.
 * Usage: restrictTo('admin', 'body_member')
 *
 * @param {...string} roles - Allowed role strings
 */
export const restrictTo = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError('You do not have permission to perform this action.', 403)
    );
  }
  next();
};

/**
 * Restricts a route to only the SBM with `designation: 'Treasurer'`.
 * Must be used AFTER `protect` and `restrictTo('sbm')`.
 *
 * Treasurer identity is stored in the DB — never trusted from a client header.
 */
export const requiresTreasurer = (req, _res, next) => {
  if (req.user.designation !== 'Treasurer') {
    return next(
      new AppError('Access restricted to the Treasurer.', 403)
    );
  }
  next();
};
