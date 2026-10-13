import mongoose from 'mongoose';
const { Schema, model } = mongoose;
import { WEDDING_EVENTS } from '../config/constants.js';

const guestSchema = new Schema(
  {
    weddingProject: {
      type: Schema.Types.ObjectId,
      ref: 'WeddingProject',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true
    },
    familyTitle: {
      type: String,
      trim: true,
      default: '' // e.g. "Chaudhry Family"
    },
    side: {
      type: String,
      enum: ['bride', 'groom', 'both'],
      default: 'bride'
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: 'Lahore'
    },
    totalMembers: {
      type: Number,
      min: [1, 'Invited members count must be at least 1'],
      default: 1
    },
    eventsInvited: [
      {
        type: String,
        enum: WEDDING_EVENTS
      }
    ],
    rsvpStatus: {
      type: String,
      enum: ['pending', 'attending', 'declined', 'tentative'],
      default: 'pending',
      index: true
    },
    rsvpConfirmedCount: {
      type: Number,
      default: 0
    },
    tableNumber: {
      type: String,
      trim: true,
      default: ''
    },
    dietaryNotes: {
      type: String,
      trim: true,
      default: ''
    },
    invitationSent: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

guestSchema.index({ weddingProject: 1, side: 1, rsvpStatus: 1 });

export const Guest = model('Guest', guestSchema);
export default Guest;
