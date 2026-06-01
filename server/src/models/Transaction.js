import mongoose from 'mongoose';

/**
 * Transaction Schema — the immutable audit log for every PhonePe payment attempt.
 *
 * Design decisions:
 * - `merchantTransactionId` is set when the order is CREATED (before payment).
 *   It is a unique ID we generate (format: ace_<timestamp>) used to track the
 *   payment through PhonePe's redirect and callback flow.
 * - `phonePeTransactionId` is set AFTER the webhook/callback fires and the
 *   X-VERIFY checksum is verified. Never written before verification.
 * - Guest support: `user` is sparse (null for guests); `guestEmail` captures identity
 *   so the Late Converter worker can migrate history if they later buy a membership.
 * - `webhookPayload` stores the raw PhonePe callback object for dispute resolution.
 */
const transactionSchema = new mongoose.Schema(
  {
    // ── PhonePe References ──────────────────────────────────
    /**
     * Our own unique transaction ID sent to PhonePe as merchantTransactionId.
     * Format: ace_<timestamp>_<random> — max 35 chars per PhonePe spec.
     * Used as the primary lookup key throughout the payment lifecycle.
     */
    merchantTransactionId: {
      type: String,
      required: [true, 'Merchant Transaction ID is required.'],
      unique: true,
      trim: true,
    },
    // Set only after PhonePe webhook/callback fires and signature is verified
    phonePeTransactionId: {
      type: String,
      default: null,
      trim: true,
    },

    // ── User / Guest Identity ───────────────────────────────
    /**
     * Populated for registered members. Null for guest checkouts.
     * sparse: true allows multiple null values without violating unique constraint.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      sparse: true,
    },
    // Guest details — essential for the Late Converter BullMQ job
    guestEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    guestName: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Event Link ──────────────────────────────────────────
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      // Optional: Pure membership purchases do not have an associated event
    },

    // ── Financial Details ───────────────────────────────────
    // Stored in PAISE to match PhonePe's native unit (₹1 = 100 paise)
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required.'],
      min: [0, 'Amount cannot be negative.'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    /**
     * The pricing tier applied to this transaction.
     * 'member'     → memberFee was charged
     * 'non_member' → standardFee was charged
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
    status: {
      type: String,
      enum: {
        values: ['created', 'paid', 'failed', 'refunded'],
        message: '{VALUE} is not a valid transaction status.',
      },
      default: 'created',
    },

    // ── Audit Trail ─────────────────────────────────────────
    // Raw PhonePe callback payload — stored for dispute resolution, never used for logic
    webhookPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Timestamp when the webhook was processed and DB was updated
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt = order creation time, updatedAt = last status change
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────
transactionSchema.index({ status: 1 });
transactionSchema.index({ event: 1 });
transactionSchema.index({ user: 1 });
// Critical for Late Converter job: find all past guest transactions by email
transactionSchema.index({ guestEmail: 1 });
transactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
