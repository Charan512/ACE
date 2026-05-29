import nodemailer from 'nodemailer';

/**
 * Nodemailer transporter singleton.
 * Reads all SMTP credentials from environment variables — nothing hardcoded.
 *
 * For Gmail: use an App Password (Settings → Security → 2FA → App Passwords).
 * For Mailtrap (dev): set SMTP_HOST=sandbox.smtp.mailtrap.io, SMTP_PORT=587.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends an email via the SMTP transporter.
 *
 * @param {Object} options
 * @param {string}   options.to      - Recipient email address
 * @param {string}   options.subject - Email subject line
 * @param {string}   options.html    - HTML body content
 * @param {string}  [options.text]   - Plain text fallback (auto-stripped from HTML if omitted)
 * @returns {Promise<Object>} Nodemailer send result
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"ACE ERP" <noreply@ace.org>',
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain-text fallback
  });

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Mailer] Email sent to ${to} — MessageID: ${info.messageId}`);
  }

  return info;
};

export default sendEmail;
