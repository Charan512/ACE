import mongoose from 'mongoose';

/**
 * Counter Schema — tracks the last issued sequential number for atomic ID generation.
 *
 * CRITICAL: Never read seq and save in two steps.
 * Always use findOneAndUpdate + $inc (see User.generateAceId()).
 * This is the only correct pattern to prevent race conditions under concurrent registrations.
 */
const counterSchema = new mongoose.Schema(
  {
    // The identifier for this counter (e.g., 'aceId')
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
      min: [0, 'Sequence cannot be negative.'],
    },
  },
  {
    // No createdAt/updatedAt needed — this is a pure atomic counter document
    timestamps: false,
    // Disable _id auto-generation since we define it manually as String
    _id: false,
    versionKey: false,
  }
);

const Counter = mongoose.model('Counter', counterSchema);

export default Counter;
