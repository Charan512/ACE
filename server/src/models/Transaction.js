import mongoose from 'mongoose';

/**
 * Transaction Schema — the immutable audit log for every Razorpay payment attempt.
 *
 * Design decisions:
 * - `razorpayOrderId` is set when the order is CREATED (before payment).
 * - `razorpayPaymentId` and `razorpaySignature` are set AFTER the webhook fires
 *   and the HMAC SHA256 signature is verified. Never written before verification.
 * - Guest support: `user` is sparse (null for guests); `guestEmail` captures their identity
 *   so the Late Converter worker can migrate their history if they later buy a membership.
 * - `webhookPayload` stores the raw Razorpay event object for dispute resolution / audit.
 */
const transactionSchema = new mongoose.Schema(
  {
    // ── Razorpay References ─────────────────────────────────
    razorpayOrderId: {
      type: String,
      required: [true, 'Razorpay Order ID is required.'],
      unique: true,
      trim: true,
    },
    // Set only after successful webhook verification
    razorpayPaymentId: {
      type: String,
      default: null,
      trim: true,
    },
    // The HMAC signature from Razorpay — stored for audit, verified before writing
    razorpaySignature: {
      type: String,
      default: null,
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
      required: [true, 'Event reference is required.'],
    },

    // ── Financial Details ───────────────────────────────────
    // Stored in PAISE to match Razorpay's native unit (₹1 = 100 paise)
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
    // Raw Razorpay webhook payload — stored for dispute resolution, never used for logic
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
