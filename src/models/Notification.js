import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export const NOTIFICATION_TYPES = [
  'booking_created',
  'booking_accepted',
  'booking_rejected',
  'booking_confirmed',
  'booking_cancelled',
  'payment_received',
  'review_received',
  'general'
];

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      default: 'general'
    },
    link: {
      type: String,
      default: ''
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = model('Notification', notificationSchema);
export default Notification;
