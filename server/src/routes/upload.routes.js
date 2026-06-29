import express from 'express';
import multer from 'multer';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const router = express.Router();

/**
 * Multer — memory storage (no disk writes).
 * Files land in req.file.buffer; we stream that buffer to Cloudinary.
 * Max file size: 10 MB.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new AppError('Only image files are allowed.', 400));
    }
    cb(null, true);
  },
});

// ── Middleware to extract format from mimetype ─────────────────
const mimeToFormat = (mimetype) => {
  const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
  return map[mimetype] || 'jpg';
};

/**
 * @desc    Upload a certificate base template or event poster (admin/ebm/sbm only)
 * @route   POST /api/admin/upload/template
 * @access  Private (Admin / EBM / SBM)
 */
router.post(
  '/template',
  protect,
  restrictTo('admin', 'ebm', 'sbm'),
  upload.single('image'),
  catchAsync(async (req, res, next) => {
    if (!req.file) return next(new AppError('No image file provided.', 400));

    const result = await uploadToCloudinary(req.file.buffer, {
      folder:         'ace/templates',
      resource_type:  'image',
      format:         mimeToFormat(req.file.mimetype),
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    res.status(200).json({
      success: true,
      data: { url: result.secure_url, publicId: result.public_id },
    });
  })
);

/**
 * @desc    Upload an event poster image (admin/ebm/sbm only)
 * @route   POST /api/admin/upload/poster
 * @access  Private (Admin / EBM / SBM)
 */
router.post(
  '/poster',
  protect,
  restrictTo('admin', 'ebm', 'sbm'),
  upload.single('image'),
  catchAsync(async (req, res, next) => {
    if (!req.file) return next(new AppError('No image file provided.', 400));

    const result = await uploadToCloudinary(req.file.buffer, {
      folder:         'ace/posters',
      resource_type:  'image',
      format:         mimeToFormat(req.file.mimetype),
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    res.status(200).json({
      success: true,
      data: { url: result.secure_url, publicId: result.public_id },
    });
  })
);

// ── Keep the legacy presigned-url route as an alias for backward compat ──
// Some older clients may still call GET /presigned-url — redirect them gracefully.
router.get('/presigned-url', protect, restrictTo('admin', 'ebm', 'sbm'), (_req, res) => {
  res.status(410).json({
    success: false,
    message: 'Presigned URL upload is deprecated. Use POST /api/admin/upload/template or /poster instead.',
  });
});

/**
 * @desc    Upload a member avatar (any authenticated user)
 * @route   POST /api/upload/avatar
 * @access  Private
 */
router.post(
  '/avatar',
  protect,
  upload.single('image'),
  catchAsync(async (req, res, next) => {
    if (!req.file) return next(new AppError('No image file provided.', 400));

    const result = await uploadToCloudinary(req.file.buffer, {
      folder:         'ace/avatars',
      public_id:      `user_${req.user._id}`, // Overwrite on re-upload (same user always same public_id)
      overwrite:      true,
      resource_type:  'image',
      format:         'webp',                  // Always convert to WebP for optimal delivery
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' }, // Smart face crop
        { quality: 'auto' },
      ],
    });

    res.status(200).json({
      success: true,
      data: { url: result.secure_url, publicId: result.public_id },
    });
  })
);

// Legacy REST presigned-url for avatar — deprecated
router.get('/avatar/presigned-url', protect, (_req, res) => {
  res.status(410).json({
    success: false,
    message: 'Use POST /api/upload/avatar with multipart/form-data instead.',
  });
});

export default router;
