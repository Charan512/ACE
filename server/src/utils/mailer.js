/**
 * Native Fetch-based Brevo (Sendinblue) Email Sender
 *
 * Uses the Transactional Emails API to send raw HTML payloads.
 * By using native fetch, we avoid bloated SDK dependencies and critical vulnerabilities
 * (like the form-data/request vulnerabilities in older SDK versions).
 */

const sendEmail = async ({ to, subject, html, text, attachments }) => {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  if (!BREVO_API_KEY) {
    throw new Error('[Mailer] BREVO_API_KEY is not defined in environment variables.');
  }

  // Parse sender from EMAIL_FROM env var.
  // Expected format: "Org Name <sender@domain.com>" or just "sender@domain.com"
  const fromEnv = process.env.EMAIL_FROM;
  if (!fromEnv) {
    throw new Error('[Mailer] EMAIL_FROM is not defined in environment variables.');
  }

  let sender = { email: fromEnv.trim() };
  const match = fromEnv.match(/^([^<]*)<([^>]+)>$/);
  if (match) {
    // Strip quotes and limit name length to prevent header injection
    const parsedName  = match[1].replace(/"/g, '').trim().substring(0, 100);
    const parsedEmail = match[2].trim();
    sender = { name: parsedName, email: parsedEmail };
  }

  const payload = {
    sender,
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };

  if (text) {
    payload.textContent = text;
  } else if (html) {
    payload.textContent = html.replace(/<[^>]*>/g, '');
  }

  if (attachments && attachments.length > 0) {
    payload.attachment = attachments.map(att => {
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
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    if (process.env.NODE_ENV !== 'production') {
      const msgId = data?.messageId || data?.messageIds?.[0] || JSON.stringify(data);
      console.log(`[Mailer] Email sent to ${to} — MessageID: ${msgId}`);
    }
    
    return data;
  } catch (error) {
    console.error('[Mailer] Error sending email via Brevo:', error.message);
    throw error;
  }
};

export default sendEmail;
