import mongoose from 'mongoose';
const { Schema, model } = mongoose;
import { PAKISTAN_CITIES } from '../config/constants.js';

const serviceListingSchema = new Schema(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'VendorProfile',
      required: true,
      index: true
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: true
    },
    categorySlug: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide listing title'],
      trim: true,
      maxlength: [140, 'Title cannot exceed 140 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      enum: {
        values: PAKISTAN_CITIES,
        message: '{VALUE} is not a supported Pakistani city'
      },
      required: [true, 'Please provide listing city']
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    images: [
      {
        type: String
      }
    ],
    startingPrice: {
      type: Number,
      required: [true, 'Please provide starting price in PKR'],
      min: [0, 'Price cannot be negative']
    },
    priceUnit: {
      type: String,
      default: 'per event slot'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    // Category Specific Metadata
    // For Venues
    capacity: {
      type: Number,
      default: 0
    },
    venueType: {
      type: String,
      default: 'Indoor Hall'
    },
    amenities: [
      {
        type: String
      }
    ],

    // For Cars
    carType: {
      type: String,
      default: ''
    },
    modelYear: {
      type: Number
    },
    passengerCapacity: {
      type: Number,
      default: 4
    },
    withDriver: {
      type: Boolean,
      default: true
    },
    includedMileage: {
      type: String,
      default: ''
    },

    // For Catering / Photography / Decor
    highlights: [
      {
        type: String
      }
    ],
    packageIncludes: [
      {
        type: String
      }
    ],

    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5
    },
    reviewsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for fast search and price filtering
serviceListingSchema.index({ city: 1, categorySlug: 1, startingPrice: 1 });
serviceListingSchema.index({ title: 'text', description: 'text' });

const ServiceListing = model('ServiceListing', serviceListingSchema);

export default ServiceListing;
