import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary SDK configuration.
 *
 * Credentials are sourced from the CLOUDINARY_URL env var (preferred — single value)
 * or the individual CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET vars as fallback.
 *
 * Upload strategy used in upload.routes.js:
 *   - Multer keeps the file in memory (never touches disk)
 *   - We stream req.file.buffer directly to Cloudinary via upload_stream()
 *   - Cloudinary returns a secure_url that we persist (avatarUrl / baseImageUrl)
 *
 * Folders:
 *   ace/avatars/   → member profile photos
 *   ace/posters/   → event poster images
 *   ace/templates/ → certificate base templates
 */
cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
  secure:      true, // Always return https URLs
});

/**
 * Wraps cloudinary.uploader.upload_stream in a Promise so it can be awaited.
 *
 * @param {Buffer} buffer      - File buffer from multer memoryStorage
 * @param {Object} options     - Cloudinary upload options (folder, public_id, etc.)
 * @returns {Promise<Object>}  - Cloudinary upload result (secure_url, public_id, …)
 */
export const uploadToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });

export default cloudinary;
