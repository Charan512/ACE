import nodemailer from 'nodemailer';

/**
 * Nodemailer transporter — uses Resend's SMTP relay.
 *
 * Why Resend instead of raw Gmail SMTP?
 *   Render.com (free tier) blocks outbound SMTP ports 25, 465, and 587.
 *   Resend's SMTP relay tunnels mail delivery over HTTPS (port 443 internally),
 *   which is never blocked. The Nodemailer interface is 100% unchanged —
 *   all workers continue to call `sendEmail({ to, subject, html })` as before.
 *
 * Setup:
 *   1. Sign up at https://resend.com (free: 3,000 emails/month, 100/day)
 *   2. Verify your sending domain (or use their shared sandbox for testing)
 *   3. Generate an API key → set RESEND_API_KEY in your .env / Render dashboard
 *   4. Set EMAIL_FROM to an address on your verified domain, e.g.:
 *      EMAIL_FROM="ACE ERP <noreply@yourdomain.com>"
 *
 * Local dev without Resend:
 *   Set RESEND_API_KEY=re_test_xxxx (any value) and use Mailtrap/Ethereal for
 *   SMTP_HOST overrides, or just let emails fail silently in dev by not setting
 *   the key — the worker error handler will catch and log it.
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true, // TLS — mandatory for Resend SMTP relay
  auth: {
    user: 'resend',                      // Always the literal string 'resend'
    pass: process.env.RESEND_API_KEY,   // Your Resend API key (re_xxxxxxxxxxxx)
  },
});

/**
 * Sends an email via the Resend SMTP relay.
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
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain-text fallback
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Mailer] Email sent to ${to} — MessageID: ${info.messageId}`);
  }

  return info;
};

export default sendEmail;
