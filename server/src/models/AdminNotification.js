import mongoose from 'mongoose';

/**
 * AdminNotification Schema — audit log for system events that the admin should be aware of.
 *
 * Currently used for:
 *   - 'cash_registration': An SBM or EBM registered an attendee in person (cash payment).
 *
 * Design decisions:
 * - Read-only collection: notifications are created by the system and never mutated.
 * - `isRead` flag allows the admin frontend to show an unread badge count.
 * - No TTL: notifications are permanent audit records.
 */
const adminNotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: {
        values: ['cash_registration', 'cash_membership'],
        message: '{VALUE} is not a valid notification type.',
      },
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null, // null for membership notifications (no event involved)
    },
    eventTitle: { type: String, trim: true },
    registrant: {
      name:  { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
      aceId: { type: String, default: null },
      type:  { type: String, enum: ['member', 'guest'] },
    },
    registeredBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registeredByName: { type: String, trim: true },
    registeredByRole: { type: String, enum: ['sbm', 'ebm'], required: true },
    amount:           { type: Number, default: 0 },
    paymentMethod:    { type: String, default: 'cash' },
    isRead:           { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

adminNotificationSchema.index({ isRead: 1 });
adminNotificationSchema.index({ type: 1 });
adminNotificationSchema.index({ createdAt: -1 });
adminNotificationSchema.index({ event: 1 });

const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);

export default AdminNotification;
