import mongoose from 'mongoose';
const { Schema, model } = mongoose;
import { BOOKING_STATUS, PAYMENT_STATUS, WEDDING_EVENTS } from '../config/constants.js';

const bookingSchema = new Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      index: true
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'VendorProfile',
      required: [true, 'Vendor Profile ID is required'],
      index: true
    },
    vendorUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vendor User ID is required'],
      index: true
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceListing',
      required: [true, 'Service Listing ID is required'],
      index: true
    },
    servicePackage: {
      type: Schema.Types.ObjectId,
      ref: 'ServicePackage'
    },
    weddingProject: {
      type: Schema.Types.ObjectId,
      ref: 'WeddingProject'
    },
    weddingEvent: {
      type: Schema.Types.ObjectId,
      ref: 'WeddingEvent'
    },
    eventName: {
      type: String,
      enum: {
        values: WEDDING_EVENTS,
        message: '{VALUE} is not a supported wedding event'
      },
      default: 'Baraat'
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
      index: true
    },
    timeSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', 'full_day'],
      default: 'evening'
    },
    guestCount: {
      type: Number,
      min: [1, 'Guest count must be at least 1'],
      default: 100
    },

    // Authoritative Frozen Price Snapshot
    packageSnapshot: {
      packageName: { type: String, default: 'Standard Service' },
      pricePKR: { type: Number, required: true },
      priceUnit: { type: String, default: 'per event' },
      includedItems: [{ type: String }],
      excludedItems: [{ type: String }]
    },
    totalAmountPKR: {
      type: Number,
      required: [true, 'Total amount in PKR is required'],
      min: [0, 'Total amount cannot be negative']
    },
    advanceDepositPKR: {
      type: Number,
      default: 0,
      min: 0
    },

    // Booking State Machine
    status: {
      type: String,
      enum: {
        values: Object.values(BOOKING_STATUS),
        message: '{VALUE} is not a valid booking status'
      },
      default: BOOKING_STATUS.PENDING,
      index: true
    },
    paymentStatus: {
      type: String,
      enum: {
        values: Object.values(PAYMENT_STATUS),
        message: '{VALUE} is not a valid payment status'
      },
      default: PAYMENT_STATUS.PENDING
    },

    customerNotes: {
      type: String,
      trim: true,
      default: ''
    },
    vendorNotes: {
      type: String,
      trim: true,
      default: ''
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: ''
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },

    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Compound index for querying bookings by vendor/customer and eventDate
bookingSchema.index({ vendor: 1, eventDate: 1, status: 1 });
bookingSchema.index({ customer: 1, eventDate: 1 });

export const Booking = model('Booking', bookingSchema);
export default Booking;
