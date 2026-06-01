import crypto from 'crypto';

// ── PhonePe Configuration ─────────────────────────────────────
// Credentials loaded from environment — NEVER hardcoded.
export const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY                   = process.env.PHONEPE_SALT_KEY;
export const SALT_INDEX          = process.env.PHONEPE_SALT_INDEX || '1';
export const PHONEPE_BASE_URL    = process.env.PHONEPE_BASE_URL ||
  'https://api-preprod.phonepe.com/apis/pg-sandbox'; // UAT default

/**
 * Generates the X-VERIFY checksum for a PhonePe API request.
 *
 * Formula: SHA256( base64EncodedPayload + apiEndpoint + saltKey ) + "###" + saltIndex
 *
 * @param {string} base64Payload - The Base64-encoded JSON request body
 * @param {string} endpoint      - The API endpoint path, e.g. "/pg/v1/pay"
 * @returns {string}             - The X-VERIFY header value
 */
export const generateChecksum = (base64Payload, endpoint) => {
  const hashInput = base64Payload + endpoint + SALT_KEY;
  const sha256    = crypto.createHash('sha256').update(hashInput).digest('hex');
  return `${sha256}###${SALT_INDEX}`;
};

/**
 * Generates the X-VERIFY checksum for the Status API.
 *
 * Formula: SHA256( "/pg/v1/status/{merchantId}/{txnId}" + saltKey ) + "###" + saltIndex
 *
 * @param {string} merchantTransactionId
 * @returns {string}
 */
export const generateStatusChecksum = (merchantTransactionId) => {
  const endpoint  = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`;
  const sha256    = crypto.createHash('sha256').update(endpoint + SALT_KEY).digest('hex');
  return `${sha256}###${SALT_INDEX}`;
};

/**
 * Verifies the X-VERIFY header on an incoming PhonePe webhook callback.
 *
 * PhonePe sends the raw JSON body and an X-VERIFY header.
 * We recompute: SHA256( base64(rawBody) + "/pg/v1/callback" + saltKey ) + "###" + saltIndex
 * and compare using timingSafeEqual to prevent timing attacks.
 *
 * @param {string} rawBodyString - The stringified JSON body from PhonePe
 * @param {string} xVerify       - The X-VERIFY header value from the request
 * @returns {boolean}
 */
export const verifyWebhookChecksum = (rawBodyString, xVerify) => {
  if (!rawBodyString || !xVerify) return false;

  try {
    const base64Body   = Buffer.from(rawBodyString).toString('base64');
    const hashInput    = base64Body + SALT_KEY;
    const computedHash = crypto.createHash('sha256').update(hashInput).digest('hex');
    const computedVerify = `${computedHash}###${SALT_INDEX}`;

    return crypto.timingSafeEqual(
      Buffer.from(computedVerify),
      Buffer.from(xVerify)
    );
  } catch {
    // Buffers of different length → definitely wrong
    return false;
  }
};
