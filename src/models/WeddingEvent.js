import mongoose from 'mongoose';
const { Schema, model } = mongoose;
import { WEDDING_EVENTS } from '../config/constants.js';

const weddingEventSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'WeddingProject',
      required: true,
      index: true
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    eventType: {
      type: String,
      enum: {
        values: WEDDING_EVENTS,
        message: '{VALUE} is not a valid wedding event type'
      },
      required: true,
      default: 'Baraat'
    },
    customTitle: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      required: [true, 'Event date is required']
    },
    startTime: {
      type: String,
      default: '19:30' // 7:30 PM default PK evening function
    },
    endTime: {
      type: String,
      default: '23:30' // 11:30 PM default PK hall closing
    },
    location: {
      type: String,
      trim: true,
      default: 'Venue to be selected'
    },
    expectedGuests: {
      type: Number,
      default: 350
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['upcoming', 'in_progress', 'completed', 'cancelled'],
      default: 'upcoming'
    }
  },
  {
    timestamps: true
  }
);

// Index to quickly sort events in chronological order
weddingEventSchema.index({ project: 1, date: 1 });

const WeddingEvent = model('WeddingEvent', weddingEventSchema);

export default WeddingEvent;
