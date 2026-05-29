/**
 * ACE ERP — Email HTML Templates
 *
 * All templates follow the Industrial Cyber-Minimalism aesthetic:
 * obsidian background, cyan accents, JetBrains Mono for IDs and data.
 * These are inlined-CSS emails for maximum client compatibility.
 */

// ── Shared Styles ──────────────────────────────────────────────
const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: #0B0F19;
  color: #f1f5f9;
  margin: 0; padding: 0;
`;

const CARD_STYLES = `
  max-width: 600px;
  margin: 32px auto;
  background: #111827;
  border: 1px solid #1e293b;
  border-radius: 4px;
  overflow: hidden;
`;

const HEADER_STYLES = `
  background: #020617;
  border-bottom: 2px solid #00d4ff;
  padding: 24px 32px;
`;

const BODY_STYLES = `
  padding: 32px;
`;

const FOOTER_STYLES = `
  padding: 16px 32px;
  border-top: 1px solid #1e293b;
  font-size: 12px;
  color: #475569;
  text-align: center;
`;

const MONO_STYLE = `
  font-family: 'Courier New', Courier, monospace;
  background: #020617;
  border: 1px solid #1e293b;
  padding: 12px 16px;
  border-radius: 2px;
  color: #00d4ff;
  font-size: 18px;
  letter-spacing: 0.15em;
  display: block;
  margin: 16px 0;
`;

const BTN_STYLE = `
  display: inline-block;
  padding: 10px 24px;
  background: #00d4ff;
  color: #0B0F19;
  text-decoration: none;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.05em;
  border-radius: 3px;
  margin-top: 16px;
`;

// ── Templates ─────────────────────────────────────────────────

/**
 * Welcome email sent to newly created ACE Members after payment clears.
 * Contains their ACE ID, temporary password, and a forced-change warning.
 *
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.aceId
 * @param {string} params.tempPassword
 * @param {string} [params.loginUrl]
 */
export const buildWelcomeEmail = ({ name, aceId, tempPassword, loginUrl = process.env.CLIENT_URL }) => ({
  subject: `Welcome to ACE — Your Member ID is ${aceId}`,
  html: `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        <div style="${HEADER_STYLES}">
          <p style="color:#00d4ff;font-size:11px;letter-spacing:0.15em;margin:0 0 8px;text-transform:uppercase;">
            ASSOCIATION OF COMPUTER ENGINEERS
          </p>
          <h1 style="color:#f1f5f9;font-size:22px;margin:0;">Membership Activated</h1>
        </div>
        <div style="${BODY_STYLES}">
          <p style="color:#94a3b8;margin:0 0 16px;">Welcome, <strong style="color:#f1f5f9;">${name}</strong>.</p>
          <p style="color:#94a3b8;">Your ACE Member ID has been assigned:</p>
          <code style="${MONO_STYLE}">${aceId}</code>
          <p style="color:#94a3b8;margin-top:24px;">Your temporary login password:</p>
          <code style="${MONO_STYLE}">${tempPassword}</code>
          <p style="color:#ef4444;font-size:13px;margin:0 0 24px;">
            ⚠️ You will be forced to change this password on first login.
          </p>
          <a href="${loginUrl}/login" style="${BTN_STYLE}">Access Your Dashboard →</a>
        </div>
        <div style="${FOOTER_STYLES}">
          If you did not purchase an ACE membership, please contact your system administrator immediately.
        </div>
      </div>
    </div>
  `,
});

/**
 * Treasurer Digest — a clean HTML table of all registrations in the flush window.
 *
 * @param {Array}  transactions - Populated Transaction documents
 * @param {Object} meta         - { firstRegistrationAt, pendingCount, forcedByCeiling }
 */
export const buildTreasurerDigestEmail = (transactions, meta) => {
  const count = transactions.length;
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const formattedRevenue = `₹${(totalRevenue / 100).toLocaleString('en-IN')}`;
  const flushReason = meta.forcedByCeiling ? '10-hour ceiling reached' : '2.5-hour inactivity timeout';

  const rows = transactions.map((tx) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #1e293b;color:#f1f5f9;">
        ${tx.user?.aceId || 'GUEST'}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #1e293b;color:#94a3b8;">
        ${tx.user?.name || tx.guestName || '—'}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #1e293b;color:#94a3b8;">
        ${tx.user?.email || tx.guestEmail || '—'}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #1e293b;color:#94a3b8;">
        ${tx.event?.title || '—'}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #1e293b;color:#00d4ff;font-family:monospace;">
        ₹${(tx.amount / 100).toLocaleString('en-IN')}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:12px;">
        ${tx.processedAt ? new Date(tx.processedAt).toLocaleString('en-IN') : '—'}
      </td>
    </tr>
  `).join('');

  return {
    subject: `ACE Treasurer Digest — ${count} Registration${count !== 1 ? 's' : ''} | ${formattedRevenue}`,
    html: `
      <div style="${BASE_STYLES}">
        <div style="max-width:900px;margin:32px auto;background:#111827;border:1px solid #1e293b;border-radius:4px;overflow:hidden;">
          <div style="${HEADER_STYLES}">
            <p style="color:#00d4ff;font-size:11px;letter-spacing:0.15em;margin:0 0 8px;text-transform:uppercase;">
              TREASURER DIGEST — AUTOMATED REPORT
            </p>
            <h1 style="color:#f1f5f9;font-size:20px;margin:0;">
              ${count} New Registration${count !== 1 ? 's' : ''} — ${formattedRevenue} Collected
            </h1>
            <p style="color:#475569;font-size:12px;margin:8px 0 0;">
              Flush reason: ${flushReason} &nbsp;|&nbsp; Period: ${new Date(parseInt(meta.firstRegistrationAt)).toLocaleString('en-IN')} → ${new Date().toLocaleString('en-IN')}
            </p>
          </div>
          <div style="padding:0;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background:#020617;">
                  <th style="padding:10px 12px;text-align:left;color:#00d4ff;letter-spacing:0.08em;font-size:11px;text-transform:uppercase;">ACE ID</th>
                  <th style="padding:10px 12px;text-align:left;color:#00d4ff;letter-spacing:0.08em;font-size:11px;text-transform:uppercase;">Name</th>
                  <th style="padding:10px 12px;text-align:left;color:#00d4ff;letter-spacing:0.08em;font-size:11px;text-transform:uppercase;">Email</th>
                  <th style="padding:10px 12px;text-align:left;color:#00d4ff;letter-spacing:0.08em;font-size:11px;text-transform:uppercase;">Event</th>
                  <th style="padding:10px 12px;text-align:left;color:#00d4ff;letter-spacing:0.08em;font-size:11px;text-transform:uppercase;">Amount</th>
                  <th style="padding:10px 12px;text-align:left;color:#00d4ff;letter-spacing:0.08em;font-size:11px;text-transform:uppercase;">Time</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
          <div style="${FOOTER_STYLES}">
            This is an automated digest generated by ACE ERP. Do not reply to this email.
          </div>
        </div>
      </div>
    `,
  };
};

/**
 * Payment failure notification to the guest/member.
 *
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.eventTitle
 * @param {string} [params.retryUrl]
 */
export const buildPaymentFailedEmail = ({ name, eventTitle, retryUrl = process.env.CLIENT_URL }) => ({
  subject: `Payment Failed — ${eventTitle}`,
  html: `
    <div style="${BASE_STYLES}">
      <div style="${CARD_STYLES}">
        <div style="${HEADER_STYLES}">
          <p style="color:#ef4444;font-size:11px;letter-spacing:0.15em;margin:0 0 8px;text-transform:uppercase;">
            PAYMENT FAILURE NOTICE
          </p>
          <h1 style="color:#f1f5f9;font-size:22px;margin:0;">Your payment could not be processed</h1>
        </div>
        <div style="${BODY_STYLES}">
          <p style="color:#94a3b8;">Hi <strong style="color:#f1f5f9;">${name}</strong>,</p>
          <p style="color:#94a3b8;">
            Your payment for <strong style="color:#f1f5f9;">${eventTitle}</strong> was unsuccessful.
            No amount has been charged to your account.
          </p>
          <p style="color:#94a3b8;">Please try registering again. If the problem persists, contact your bank.</p>
          <a href="${retryUrl}" style="${BTN_STYLE}">Try Again →</a>
        </div>
        <div style="${FOOTER_STYLES}">
          If you believe this is an error, contact the ACE team with your payment reference.
        </div>
      </div>
    </div>
  `,
});
