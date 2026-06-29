import mongoose from 'mongoose';

// ── Subdocuments ─────────────────────────────────────────────

/**
 * A single text overlay field for the zero-storage certificate engine.
 *
 * Positions are stored as PERCENTAGES (0–100) relative to the canvas dimensions,
 * not as absolute pixels. This makes templates resolution-independent.
 *
 * At render time, the certRenderer.js multiplies these percentages against
 * the actual loaded image dimensions to get absolute pixel coordinates.
 */
const textFieldSchema = new mongoose.Schema(
  {
    // Variable name to inject (e.g., 'recipientName', 'aceId', 'eventTitle', 'date')
    label: {
      type: String,
      required: [true, 'Text field label is required.'],
      trim: true,
    },
    // Horizontal position as % of canvas width (0 = left edge, 100 = right edge)
    xPercent: {
      type: Number,
      required: true,
      min: [0, 'xPercent must be between 0 and 100.'],
      max: [100, 'xPercent must be between 0 and 100.'],
    },
    // Vertical position as % of canvas height (0 = top, 100 = bottom)
    yPercent: {
      type: Number,
      required: true,
      min: [0, 'yPercent must be between 0 and 100.'],
      max: [100, 'yPercent must be between 0 and 100.'],
    },
    // Font size as % of canvas width — scales with image resolution
    fontSizePercent: {
      type: Number,
      required: true,
      min: [0.1, 'fontSizePercent must be at least 0.1.'],
      max: [20, 'fontSizePercent cannot exceed 20.'],
    },
    fontFamily: {
      type: String,
      default: 'JetBrains Mono',
      trim: true,
    },
    color: {
      type: String,
      default: '#000000',
      match: [/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color must be a valid hex code.'],
    },
    textAlign: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'center',
    },
    fontWeight: {
      type: String,
      enum: ['normal', 'bold'],
      default: 'bold',
    },
  },
  { _id: false }
);

/**
 * Embeds the full certificate template definition into each Event document.
 * The base image lives in Cloudflare R2; text overlays are derived from textFields at runtime.
 */
const certificateTemplateSchema = new mongoose.Schema(
  {
    // Public Cloudflare R2 URL for the blank certificate background image
    baseImageUrl: {
      type: String,
      required: [true, 'Certificate base image URL is required.'],
      trim: true,
    },
    // Array of text overlay positions — typically: recipientName, aceId, eventTitle, date
    textFields: {
      type: [textFieldSchema],
      validate: {
        validator: (fields) => fields.length > 0,
        message: 'A certificate template must have at least one text field.',
      },
    },
  },
  { _id: false }
);

/**
 * Admin-configurable email template for event communications.
 * Template variables are interpolated before sending:
 *   {{name}}         — registrant's name
 *   {{event_name}}   — event title
 *   {{event_date}}   — formatted event date
 *   For certificate mail: {{certificate_link}} is replaced by "see attachment"
 */
const eventEmailTemplateSchema = new mongoose.Schema(
  {
    subject: { type: String, default: '', trim: true },
    body:    { type: String, default: '' },
    isHtml:  { type: Boolean, default: true },
  },
  { _id: false }
);

/**
 * A single admin-defined field in the event's dynamic registration form.
 * Guests must fill these out; members bypass via Fast-Pass.
 */
const customFormFieldSchema = new mongoose.Schema(
  {
    // Human-readable label shown to the guest (e.g. "T-Shirt Size", "Roll Number")
    fieldName: {
      type: String,
      required: [true, 'Field name is required.'],
      trim: true,
    },
    // The HTML input type to render on the guest checkout form
    fieldType: {
      type: String,
      enum: {
        values: ['text', 'number', 'select', 'radio'],
        message: '{VALUE} is not a valid field type.',
      },
      default: 'text',
    },
    // Whether the guest must provide an answer
    required: {
      type: Boolean,
      default: false,
    },
    // Populated only for 'select' and 'radio' types
    options: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

// ── Main Event Schema ─────────────────────────────────────────

const eventSchema = new mongoose.Schema(
  {
    // ── Core Info ──────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Event title is required.'],
      trim: true,
      maxlength: [200, 'Event title cannot exceed 200 characters.'],
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters.'],
    },
    bannerImage: {
      type: String, // R2 public URL for the event banner
      default: null,
    },
    posterImage: {
      type: String, // A4 aspect ratio horizontal image
      default: null,
    },
    coordinators: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true }
      }
    ],
    venue: {
      type: String,
      trim: true,
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required.'],
    },
    registrationDeadline: {
      type: Date,
    },

    // ── Organiser ──────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Dual-Tier Pricing ──────────────────────────────────
    /**
     * Amounts stored in INR (whole rupees). The payment controller
     * converts to paise (×100) at order-creation time for PhonePe.
     * memberFee:    price for users with role 'member', 'sbm', or 'ebm'
     * standardFee: price for guests or non-members
     */
    memberFee: {
      type: Number,
      required: [true, 'Member fee is required.'],
      min: [0, 'Member fee cannot be negative.'],
    },
    standardFee: {
      type: Number,
      required: [true, 'Standard fee is required.'],
      min: [0, 'Standard fee cannot be negative.'],
    },

    // ── Capacity ───────────────────────────────────────────
    maxCapacity: {
      type: Number,
      min: [1, 'Capacity must be at least 1.'],
      default: null, // null = unlimited
    },
    registeredCount: {
      type: Number,
      default: 0,
    },

    // ── Year Exclusivity ───────────────────────────────────
    /**
     * Which student years (1-4) are allowed to register for this event.
     * Default: [1,2,3,4] = open to all years.
     * Example: [2] = exclusive to 2nd years only.
     * Validation enforced in payment + cashRegistration controllers before any order is created.
     */
    allowedYears: {
      type: [Number],
      default: [1, 2, 3, 4],
      validate: {
        validator: (arr) => arr.every((y) => [1, 2, 3, 4].includes(y)),
        message:   'allowedYears must contain values between 1 and 4.',
      },
    },

    // ── Certificate Template (Zero-Storage Engine) ─────────
    certificateTemplate: {
      type: certificateTemplateSchema,
      default: null, // Not all events may have certificates
    },
    certificatesReleased: {
      type: Boolean,
      default: false,
    },

    // ── Dynamic Guest Registration Form ────────────────────
    /**
     * Admin-defined custom fields that guests must fill on checkout.
     * Members bypass these fields entirely (Fast-Pass).
     * Each entry references `customFormFieldSchema` for shape validation.
     */
    customFormFields: {
      type: [customFormFieldSchema],
      default: [],
    },

    // ── Per-Event Email Templates ──────────────────────────
    /**
     * Admin-configured email sent to EVERY registrant (member + guest)
     * immediately after successful registration (online or cash).
     * The QR code (for guests) is attached separately — this controls the body.
     * Template variables: {{name}}, {{event_name}}, {{event_date}}
     */
    registrationConfirmationEmail: {
      type:    eventEmailTemplateSchema,
      default: () => ({ subject: '', body: '', isHtml: true }),
    },

    /**
     * Admin-configured email sent to ALL registrants (member + guest) when
     * the admin releases certificates for this event.
     * The certificate PNG is attached automatically — this controls the body.
     * Template variables: {{name}}, {{event_name}}, {{event_date}}
     */
    postEventCertificateEmail: {
      type:    eventEmailTemplateSchema,
      default: () => ({ subject: '', body: '', isHtml: true }),
    },

    // ── Publication Status ────────────────────────────────
    /**
     * 'draft'     → event is in preparation; only visible to admin/sbm/ebm in their panels.
     * 'published' → event is live and visible to members and guests in the public feed.
     *
     * Events MUST be explicitly published by an admin after creation.
     * This prevents accidentally exposing draft events before they are ready.
     */
    status: {
      type: String,
      enum: {
        values: ['draft', 'published'],
        message: '{VALUE} is not a valid event status.',
      },
      default: 'draft',
    },

    // ── Metadata ────────────────────────────────
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────
eventSchema.index({ eventDate: 1 });
eventSchema.index({ isActive: 1 });
eventSchema.index({ status: 1 });   // Critical for draft/published filtering
eventSchema.index({ tags: 1 });
// Note: slug unique index is defined on the field itself (unique: true, sparse: true)

// ── Pre-save: Auto-generate slug from title ───────────────────
eventSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')   // Remove special chars
      .replace(/\s+/g, '-')            // Spaces → hyphens
      .replace(/-+/g, '-')             // Collapse multiple hyphens
      .trim();
  }
  next();
});

// ── Virtual: Is registration open? ───────────────────────────────
eventSchema.virtual('isRegistrationOpen').get(function () {
  const now            = new Date();
  const deadlinePassed = this.registrationDeadline && now > this.registrationDeadline;
  const capacityFull   = this.maxCapacity !== null && this.registeredCount >= this.maxCapacity;
  // Registration is only possible when:
  //   1. Event is published (not draft)
  //   2. Manual toggle is open (isActive: true)
  //   3. Deadline has not passed
  //   4. Capacity is not full
  return this.status === 'published' && this.isActive && !deadlinePassed && !capacityFull;
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
