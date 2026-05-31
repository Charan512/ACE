import express from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

const router = express.Router();

// Ensure S3 client handles undefined gracefully or throws early if not configured
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

/**
 * @desc    Generate a pre-signed URL for direct-to-bucket uploads
 * @route   GET /api/admin/upload/presigned-url
 * @access  Private (Admin / EBM / SBM)
 */
router.get(
  '/presigned-url',
  protect,
  restrictTo('admin', 'ebm', 'sbm'),
  catchAsync(async (req, res, next) => {
    const { fileName, fileType } = req.query;

    if (!fileName || !fileType) {
      return next(new AppError('fileName and fileType query parameters are required.', 400));
    }

    if (!process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_DOMAIN) {
      return next(new AppError('Cloudflare R2 configuration is missing on the server.', 500));
    }

    // Generate unique key to prevent overwrites
    const ext = fileName.split('.').pop();
    const key = `posters/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    // Generate the pre-signed URL valid for 5 minutes
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    // Construct the public URL that will be used to access the image
    const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;

    res.status(200).json({
      success: true,
      data: {
        uploadUrl,
        publicUrl,
      },
    });
  })
);

export default router;
