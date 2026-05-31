import mongoose from 'mongoose';

/**
 * Registration Schema — the canonical attendance record for an event.
 *
 * Design decisions:
 * - Deliberately separate from Transaction.js: a Transaction is the financial
 *   audit log; a Registration is the operational attendance record.
 * - `userId` is sparse to support guest registrations (no ACE account needed).
 * - Guest identity is captured via `guestName` + `guestEmail` for the Late
 *   Converter BullMQ worker to auto-migrate history when a guest gets a membership.
 * - `transactionId` links back to the payment record for reconciliation.
 * - NO financial amount fields are stored here — amounts live in Transaction only.
 * - `customResponses` is a flexible Mixed object: { [fieldName]: answer }
 *   It stores the guest's answers to the event's dynamic custom form fields.
 *   Members bypass this entirely (Fast-Pass); their customResponses is always {}.
 */
const registrationSchema = new mongoose.Schema(
  {
    // ── Event Link ──────────────────────────────────────────
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required.'],
    },

    // ── Registrant Identity ─────────────────────────────────
    /**
     * Populated for ACE Members. Null for guest check-outs.
     * sparse: true allows multiple null values without violating unique constraints.
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      sparse: true,
    },
    // Guest fallback fields — used by Late Converter BullMQ job
    guestName: {
      type: String,
      trim: true,
      default: null,
    },
    guestEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },

    // ── Core Contact Info ────────────────────────────────────
    // Denormalised here so admin registration tables don't require deep population
    name: {
      type: String,
      required: [true, 'Registrant name is required.'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    // ── Dynamic Custom Form Responses ────────────────────────
    /**
     * Stores guest answers to the event's `customFormFields`.
     * Shape: { [fieldName: string]: string | number }
     *
     * Using Schema.Types.Mixed (plain JS object) instead of Map for simplicity:
     * - No type-casting complexity on the frontend
     * - Dot-notation access works without .get() calls
     * - Mongoose marks Mixed fields dirty via markModified() on mutation
     *
     * For member registrations (Fast-Pass), this defaults to {}.
     */
    customResponses: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ── Pricing Tier ────────────────────────────────────────
    /**
     * 'member'     → memberFee was applied
     * 'non_member' → standardFee was applied
     */
    tier: {
      type: String,
      enum: {
        values: ['member', 'non_member'],
        message: '{VALUE} is not a valid pricing tier.',
      },
      required: [true, 'Pricing tier is required.'],
    },

    // ── Status ──────────────────────────────────────────────
    /**
     * confirmed  → payment verified via Razorpay webhook; attendance is locked in
     * pending    → order created but payment not yet confirmed (webhook not received)
     * cancelled  → registration was cancelled or payment failed
     */
    status: {
      type: String,
      enum: {
        values: ['confirmed', 'pending', 'cancelled'],
        message: '{VALUE} is not a valid registration status.',
      },
      default: 'pending',
    },

    // ── Payment Link ────────────────────────────────────────
    /**
     * Back-reference to the Transaction document.
     * sparse: sparse index allows null (if registration is free or pre-confirmed).
     */
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
      sparse: true,
    },
  },
  {
    timestamps: true, // createdAt = registration time, updatedAt = last status change
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────
registrationSchema.index({ eventId: 1 });
registrationSchema.index({ userId: 1 });
registrationSchema.index({ status: 1 });
registrationSchema.index({ guestEmail: 1 });
// Prevent double-registration: one user can only register once per event
registrationSchema.index(
  { eventId: 1, userId: 1 },
  { unique: true, sparse: true, name: 'unique_user_event_registration' }
);

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;
