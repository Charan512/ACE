import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Counter from './Counter.js';

// ── Subdocuments ─────────────────────────────────────────────

/**
 * Tracks a single attended event entry in the Member's history vault.
 */
const attendedEventSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    // Date the member physically attended or registration was confirmed
    attendedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * Tracks a certificate earned for a specific event.
 */
const certificateEarnedSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * OTP state for password reset — stores the hashed OTP, expiry, and last-sent
 * timestamp for the 60-second debounce rate limit.
 */
const otpSchema = new mongoose.Schema(
  {
    code: { type: String },           // bcrypt-hashed OTP
    expiresAt: { type: Date },        // 10-minute TTL
    lastSentAt: { type: Date },       // Debounce: reject resend if < 60s ago
  },
  { _id: false }
);

// ── Main User Schema ─────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    // ── Identity ───────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [8, 'Password must be at least 8 characters.'],
      select: false, // Never returned in queries by default
    },

    // ── ACE-Specific ────────────────────────────────────────
    /**
     * Sequential member ID in format: 26ACE0001, 26ACE0002, ...
     * Only set for role: 'member'. Admins and EBMs do not receive an aceId.
     * Generated atomically via Counter.$inc — never set manually.
     */
    aceId: {
      type: String,
      unique: true,
      sparse: true, // Guests do not have an aceId — sparse allows multiple nulls
      match: [/^26ACE\d{4}$/, 'ACE ID must be in format 26ACE0001.'],
    },
    role: {
      type: String,
      enum: {
        /**
         * Role hierarchy (highest → lowest):
         *   admin   → Full system access
         *   ebm     → Executive Body Member (EBM)
         *   sbm     → Student Body Member (SBM)
         *   member  → Verified ACE Member
         *   guest   → Public / pre-membership user
         */
        values: ['admin', 'ebm', 'sbm', 'member', 'guest'],
        message: '{VALUE} is not a valid role. Must be one of: admin, ebm, sbm, member, guest.',
      },
      default: 'guest',
    },

    // ── Auth State ──────────────────────────────────────────
    /**
     * Forces a password change on next login.
     * Set to true when the system auto-generates a temp password after payment.
     */
    requiresPasswordChange: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    otp: otpSchema,

    // ── Profile ─────────────────────────────────────────────
    collegeId: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-()]{7,15}$/, 'Please provide a valid phone number.'],
    },
    branch: {
      type: String,
      trim: true,
      maxlength: [100, 'Branch name cannot exceed 100 characters.'],
    },
    /**
     * Section within the branch (e.g., 'A', 'B', 'C').
     * Optional — not required during public registration.
     */
    section: {
      type: String,
      trim: true,
      maxlength: [10, 'Section cannot exceed 10 characters.'],
    },
    year: {
      type: Number,
      min: [1, 'Year must be between 1 and 4.'],
      max: [4, 'Year must be between 1 and 4.'],
    },
    /**
     * College registration number (e.g., "22B91A0501").
     * Unique per student — sparse so multiple nulls are allowed
     * (guests and body members may not have one).
     */
    registrationNumber: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },

    // ── Body Member Fields (SBM / EBM) ──────────────────────
    /**
     * The club functional domain the body member operates in.
     * Only relevant for role: 'sbm' | 'ebm'.
     */
    domain: {
      type: String,
      enum: {
        values: ['Tech', 'Marketing', 'Editing', 'Documentation'],
        message: '{VALUE} is not a valid domain.',
      },
      default: null,
    },
    /**
     * Official designation within the body (e.g., 'Secretary', 'Treasurer').
     * Only relevant for role: 'ebm'.
     */
    designation: {
      type: String,
      trim: true,
      maxlength: [100, 'Designation cannot exceed 100 characters.'],
      default: null,
    },
    profilePhoto: {
      type: String, // R2 public URL
      default: null,
    },

    // ── Payment ──────────────────────────────────────────────
    razorpayCustomerId: {
      type: String,
      default: null,
    },

    // ── Member Vault ─────────────────────────────────────────
    history: {
      attendedEvents: {
        type: [attendedEventSchema],
        default: [],
      },
      certificatesEarned: {
        type: [certificateEarnedSchema],
        default: [],
      },
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────
// email and aceId are already indexed via unique: true / sparse: true
userSchema.index({ role: 1 });
userSchema.index({ 'history.attendedEvents.event': 1 });

// ── Middleware: Hash password before save ─────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if the password field was actually modified
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance Methods ──────────────────────────────────────────

/**
 * Compares a plain-text candidate password against the stored bcrypt hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Static Methods ────────────────────────────────────────────

/**
 * Atomically generates the next sequential ACE Member ID.
 *
 * Uses MongoDB findOneAndUpdate + $inc on the Counters collection.
 * This is the ONLY safe pattern — a read + write in two steps would
 * create a race condition under concurrent registrations.
 *
 * Format: 26ACE0001, 26ACE0002, ... 26ACE9999
 *
 * @returns {Promise<string>} e.g., "26ACE0042"
 */
userSchema.statics.generateAceId = async function () {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'aceId' },
    { $inc: { seq: 1 } },
    {
      new: true,       // Return the document AFTER the increment
      upsert: true,    // Create the counter document if it doesn't exist yet
      setDefaultsOnInsert: true,
    }
  );

  // Zero-pad to 4 digits: 1 → "0001", 42 → "0042"
  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `26ACE${paddedSeq}`;
};

const User = mongoose.model('User', userSchema);

export default User;
