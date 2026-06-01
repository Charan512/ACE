import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import AppError from './appError.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Font Registration ────────────────────────────────────────
// Any .ttf / .otf files placed in server/src/assets/fonts/ are auto-loaded.
// JetBrains Mono and Plus Jakarta Sans should be placed there for certificate rendering.
// Falls back to system fonts if directory is missing or empty.
try {
  const fontsLoaded = GlobalFonts.loadFontsFromDir(join(__dirname, '../assets/fonts'));
  if (fontsLoaded > 0) {
    console.log(`[CertRenderer] Loaded ${fontsLoaded} custom font(s) from assets/fonts/`);
  }
} catch {
  console.warn('[CertRenderer] assets/fonts/ not found. Using system fonts as fallback.');
}

// ─────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Fetches a remote image (e.g., from Cloudflare R2 public URL) into a Buffer.
 *
 * The image is held in RAM only for the duration of the request.
 * It is NEVER written to disk or re-uploaded to any bucket.
 *
 * @param {string} url - Public URL of the base certificate template in R2
 * @returns {Promise<Buffer>} Raw image bytes
 */
const fetchImageToBuffer = async (url) => {
  let response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(10_000), // 10-second timeout
    });
  } catch (err) {
    throw new AppError(`Could not reach certificate template source: ${err.message}`, 502);
  }

  if (!response.ok) {
    throw new AppError(
      `Failed to fetch certificate template (HTTP ${response.status}): ${url}`,
      502
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

/**
 * Renders a personalized certificate PNG entirely in memory.
 *
 * Algorithm (using the canvas_mapper pattern from .agents/skills/canvas_mapper.js):
 *  1. Fetch base template image from R2 into a Buffer
 *  2. Create a canvas exactly the size of the source image
 *  3. Draw the base template
 *  4. For each textField in the Event's certificateTemplate:
 *       absoluteX    = round((xPercent    / 100) * canvasWidth)
 *       absoluteY    = round((yPercent    / 100) * canvasHeight)
 *       absoluteFont = round((fontSizePercent / 100) * canvasWidth)
 *  5. Stamp the resolved text at the absolute coordinates
 *  6. Return a PNG Buffer — nothing written to disk, nothing uploaded
 *
 * @param {Object} options
 * @param {string}   options.baseImageUrl   - Cloudflare R2 public URL of the blank template
 * @param {Array}    options.textFields     - Text field configs from event.certificateTemplate.textFields
 * @param {Object}   options.data           - Variable name → actual value map
 *                                           Supported keys:
 *                                             recipientName → user.name
 *                                             aceId         → user.aceId (or 'GUEST')
 *                                             eventTitle    → event.title
 *                                             eventDate     → formatted event date
 *                                             [custom]      → any label defined in textFields
 * @returns {Promise<Buffer>} PNG image buffer ready to stream to client
 */
const renderCertificate = async ({ baseImageUrl, textFields, data }) => {
  if (!baseImageUrl) {
    throw new AppError('Certificate base image URL is required.', 400);
  }
  if (!textFields || textFields.length === 0) {
    throw new AppError('Certificate template has no text fields defined.', 400);
  }

  // ── Step 1: Fetch base image from R2 to RAM ───────────────
  const imageBuffer = await fetchImageToBuffer(baseImageUrl);

  // ── Step 2: Load into canvas ──────────────────────────────
  const baseImage = await loadImage(imageBuffer);
  const { width, height } = baseImage;

  if (width === 0 || height === 0) {
    throw new AppError('Certificate template image has invalid dimensions.', 502);
  }

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // ── Step 3: Draw the base template ───────────────────────
  ctx.drawImage(baseImage, 0, 0, width, height);

  // ── Step 4 & 5: Stamp each text overlay ──────────────────
  for (const field of textFields) {
    const {
      label,
      xPercent,
      yPercent,
      fontSizePercent,
      fontFamily = 'JetBrains Mono',
      color = '#000000',
      textAlign = 'center',
      fontWeight = 'bold',
    } = field;

    // Resolve the variable value
    const text = data[label];
    if (text === undefined || text === null || text === '') {
      console.warn(`[CertRenderer] No data provided for field label "${label}". Skipping.`);
      continue;
    }

    // ── canvas_mapper.js pattern ──────────────────────────
    // Converts relative percentages to absolute pixel coordinates.
    // This makes templates resolution-independent — a template designed at 1200×800
    // renders identically at 2400×1600 or any other resolution.
    const absoluteX = Math.round((xPercent / 100) * width);
    const absoluteY = Math.round((yPercent / 100) * height);
    const absoluteFontSize = Math.round((fontSizePercent / 100) * width);

    ctx.save();
    ctx.font = `${fontWeight} ${absoluteFontSize}px "${fontFamily}"`;
    ctx.fillStyle = color;
    ctx.textAlign = textAlign;
    ctx.textBaseline = 'middle'; // Y coordinate points to vertical center of text
    ctx.fillText(String(text), absoluteX, absoluteY);
    ctx.restore();
  }

  // ── Step 6: Return PNG buffer ──────────────────────────────
  // canvas.toBuffer() is synchronous in @napi-rs/canvas — returns Uint8Array.
  // We wrap in Buffer for compatibility with Node streams.
  // After this returns, the canvas and imageBuffer go out of scope and are GC'd.
  return Buffer.from(canvas.toBuffer('image/png'));
};

export default renderCertificate;
