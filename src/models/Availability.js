import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const availabilitySchema = new Schema(
  {
    service: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceListing',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    timeSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', 'full_day'],
      default: 'evening',
      required: true
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'booked', 'blocked'],
      default: 'available',
      index: true
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking'
    },
    reason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Physically guarantee at the database level that no service can have duplicate slot reservations
availabilitySchema.index({ service: 1, date: 1, timeSlot: 1 }, { unique: true });

export const Availability = model('Availability', availabilitySchema);
export default Availability;
