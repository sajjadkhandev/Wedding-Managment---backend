import mongoose from 'mongoose';
const { Schema, model } = mongoose;
import { PAKISTAN_CITIES } from '../config/constants.js';

const weddingProjectSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide wedding title'],
      trim: true,
      default: 'Our Royal Pakistani Wedding'
    },
    coupleNames: {
      bride: {
        type: String,
        trim: true,
        default: 'Bride'
      },
      groom: {
        type: String,
        trim: true,
        default: 'Groom'
      }
    },
    city: {
      type: String,
      enum: {
        values: PAKISTAN_CITIES,
        message: '{VALUE} is not a supported Pakistani city'
      },
      default: 'Lahore'
    },
    totalBudgetPKR: {
      type: Number,
      default: 2500000, // Default 2.5 Million PKR typical estimate
      min: [0, 'Budget cannot be negative']
    },
    weddingDate: {
      type: Date
    },
    guestCount: {
      type: Number,
      default: 400
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed', 'archived'],
      default: 'planning'
    }
  },
  {
    timestamps: true
  }
);

const WeddingProject = model('WeddingProject', weddingProjectSchema);

export default WeddingProject;
