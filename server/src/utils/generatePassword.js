import crypto from 'crypto';

/**
 * Generates a cryptographically secure 8-character temporary password.
 *
 * Uses crypto.randomBytes (CSPRNG) — never Math.random().
 * The output is base64url encoded, which gives a character set of A-Z, a-z, 0-9, -, _
 * making it safe to transmit in emails and URLs without encoding.
 *
 * 6 random bytes → base64url → exactly 8 characters.
 * Entropy: 6 * 8 = 48 bits — sufficient for a single-use forced-change temp password.
 *
 * @returns {string} An 8-character alphanumeric-plus-symbols temp password
 */
const generateTempPassword = () => {
  return crypto.randomBytes(6).toString('base64url');
};

export default generateTempPassword;
