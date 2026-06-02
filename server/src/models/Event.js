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

    // ── Metadata ───────────────────────────────────────────
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

// ── Indexes ───────────────────────────────────────────────────
eventSchema.index({ eventDate: 1 });
eventSchema.index({ isActive: 1 });
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

// ── Virtual: Is registration open? ───────────────────────────
eventSchema.virtual('isRegistrationOpen').get(function () {
  const now = new Date();
  const deadlinePassed = this.registrationDeadline && now > this.registrationDeadline;
  const capacityFull = this.maxCapacity !== null && this.registeredCount >= this.maxCapacity;
  return this.isActive && !deadlinePassed && !capacityFull;
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
