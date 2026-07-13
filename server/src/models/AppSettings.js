import mongoose from 'mongoose';

/**
 * AppSettings Schema — a singleton document for global admin-configurable settings.
 *
 * Design decisions:
 * - Singleton pattern: there will only ever be ONE document in this collection,
 *   always fetched with `AppSettings.getSingleton()`.
 * - `membershipFee` replaces all hardcoded ₹500 values in the codebase.
 * - `membershipCertificateTemplate` reuses the same textFieldSchema as Event,
 *   ensuring the same canvas-mapper rendering pipeline works for membership certs.
 * - `membershipConfirmationEmailTemplate` is admin-configurable, with support for
 *   template variables: {{name}}, {{email}}, {{ace_id}}, {{fee_paid}}.
 */

// ── Text Field Subdocument (reused from Event schema pattern) ─────────────────
const textFieldSchema = new mongoose.Schema(
  {
    label:          { type: String, required: true, trim: true },
    xPercent:       { type: Number, required: true, min: 0, max: 100 },
    yPercent:       { type: Number, required: true, min: 0, max: 100 },
    fontSizePercent:{ type: Number, required: true, min: 0.1, max: 20 },
    fontFamily:     { type: String, default: 'JetBrains Mono', trim: true },
    color:          { type: String, default: '#000000' },
    textAlign:      { type: String, enum: ['left', 'center', 'right'], default: 'center' },
    fontWeight:     { type: String, enum: ['normal', 'bold'], default: 'bold' },
  },
  { _id: false }
);

// ── Email Template Subdocument ────────────────────────────────────────────────
const emailTemplateSchema = new mongoose.Schema(
  {
    subject: { type: String, default: 'Welcome to ACE — {{name}}', trim: true },
    body:    {
      type:    String,
      default: '<p>Dear {{name}}, your ACE ID is <strong>{{ace_id}}</strong>. Fee paid: ₹{{fee_paid}}.</p>',
    },
    isHtml:  { type: Boolean, default: true },
  },
  { _id: false }
);

// ── Main AppSettings Schema ───────────────────────────────────────────────────
const appSettingsSchema = new mongoose.Schema(
  {
    // ── Membership ─────────────────────────────────────────────────────────
    /**
     * Membership fee in INR (whole rupees).
     * Replaces the hardcoded 50000 paise (₹500) default in payment.controller.js.
     * The payment controller reads this at order-creation time and converts to paise (×100).
     */
    membershipFee: {
      type:    Number,
      default: 400,
      min:     [0, 'Membership fee cannot be negative.'],
    },

    /**
     * Admin-configured email template sent to the registrant on successful membership creation.
     * Supports template variables: {{name}}, {{email}}, {{ace_id}}, {{fee_paid}}
     */
    membershipConfirmationEmailTemplate: {
      type:    emailTemplateSchema,
      default: () => ({}),
    },

    /**
     * Canvas-based membership certificate template.
     * Identical structure to Event.certificateTemplate — uses the same certRenderer.js pipeline.
     * Supported data keys: recipientName, aceId, memberSince
     */
    membershipCertificateTemplate: {
      baseImageUrl: { type: String, default: null, trim: true },
      textFields:   { type: [textFieldSchema], default: [] },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Singleton accessor ────────────────────────────────────────────────────────
/**
 * Returns the singleton AppSettings document, creating it with defaults if it doesn't exist.
 * Always use this — never call AppSettings.findOne() directly.
 */
appSettingsSchema.statics.getSingleton = async function () {
  const SINGLETON_ID = 'ace_app_settings';
  return this.findOneAndUpdate(
    { _id: SINGLETON_ID },
    { $setOnInsert: { _id: SINGLETON_ID } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

appSettingsSchema.statics.updateSingleton = async function (updates) {
  const SINGLETON_ID = 'ace_app_settings';
  return this.findOneAndUpdate(
    { _id: SINGLETON_ID },
    { $set: updates },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

// Use string _id for the singleton
appSettingsSchema.set('_id', false);
// Re-enable _id but allow string type
const AppSettings = mongoose.model(
  'AppSettings',
  new mongoose.Schema(
    { ...appSettingsSchema.obj, _id: { type: String } },
    { ...appSettingsSchema.options }
  )
);

// Re-attach static methods since we rebuilt the schema
AppSettings.getSingleton = async function () {
  const SINGLETON_ID = 'ace_app_settings';
  return AppSettings.findOneAndUpdate(
    { _id: SINGLETON_ID },
    { $setOnInsert: { _id: SINGLETON_ID } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

AppSettings.updateSingleton = async function (updates) {
  const SINGLETON_ID = 'ace_app_settings';
  return AppSettings.findOneAndUpdate(
    { _id: SINGLETON_ID },
    { $set: updates },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export default AppSettings;
