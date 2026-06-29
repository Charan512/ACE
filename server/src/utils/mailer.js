import * as brevo from '@getbrevo/brevo';

/**
 * Brevo (formerly Sendinblue) SDK Email Sender
 *
 * Uses the Transactional Emails API to send raw HTML payloads.
 * This guarantees completely clean and unbranded delivery for production emails.
 */

// Initialize the Brevo API instance
const apiInstance = new brevo.TransactionalEmailsApi();

// Set the API key
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

/**
 * Sends an email via the Brevo Transactional HTTPS API.
 *
 * @param {Object}   options
 * @param {string}   options.to          - Recipient email address
 * @param {string}   options.subject     - Email subject line
 * @param {string}   options.html        - HTML body content
 * @param {string}  [options.text]       - Plain text fallback
 * @param {Array}   [options.attachments] - Array of attachment objects:
 *                                          [{ name, content: Buffer }] // Note: Brevo uses `name` instead of `filename` and base64 string for content if raw. Wait, we need to adapt nodemailer style `{ filename, content }` to Brevo style.
 * @returns {Promise<Object>} Brevo API response
 */
const sendEmail = async ({ to, subject, html, text, attachments }) => {
  const sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  
  if (text) {
    sendSmtpEmail.textContent = text;
  } else if (html) {
    sendSmtpEmail.textContent = html.replace(/<[^>]*>/g, '');
  }

  // Parse sender from "Name <email@domain.com>" or just "email@domain.com"
  const fromEnv = process.env.EMAIL_FROM || "noreply@example.com";
  const match = fromEnv.match(/(.*?)\s*<(.+)>/);
  if (match) {
    sendSmtpEmail.sender = { name: match[1].replace(/"/g, '').trim(), email: match[2].trim() };
  } else {
    sendSmtpEmail.sender = { email: fromEnv.trim() };
  }

  sendSmtpEmail.to = [{ email: to }];

  // Adapt nodemailer-style attachments to Brevo-style
  if (attachments && attachments.length > 0) {
    sendSmtpEmail.attachment = attachments.map(att => {
      // Brevo expects content as base64 string
      const base64Content = Buffer.isBuffer(att.content) 
        ? att.content.toString('base64') 
        : Buffer.from(att.content).toString('base64');
        
      return {
        name: att.filename || att.name,
        content: base64Content
      };
    });
  }

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Mailer] Email sent to ${to} — MessageID: ${data.messageId}`);
    }
    return data;
  } catch (error) {
    console.error('[Mailer] Error sending email via Brevo:', error.response?.text || error.message);
    throw error;
  }
};

export default sendEmail;
