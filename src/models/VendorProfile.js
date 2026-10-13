import mongoose from 'mongoose';
const { Schema, model } = mongoose;
import { PAKISTAN_CITIES } from '../config/constants.js';

const vendorProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    businessName: {
      type: String,
      required: [true, 'Please provide business name'],
      trim: true,
      maxlength: [120, 'Business name cannot exceed 120 characters']
    },
    city: {
      type: String,
      enum: {
        values: PAKISTAN_CITIES,
        message: '{VALUE} is not a supported Pakistani city'
      },
      required: [true, 'Please specify the primary operating city']
    },
    address: {
      type: String,
      required: [true, 'Please provide commercial business address'],
      trim: true
    },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ServiceCategory'
      }
    ],
    categorySlugs: [
      {
        type: String,
        index: true
      }
    ],
    description: {
      type: String,
      trim: true,
      default: ''
    },
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80'
    },
    portfolioImages: [
      {
        type: String
      }
    ],
    phone: {
      type: String,
      required: [true, 'Please provide business phone number']
    },
    whatsapp: {
      type: String,
      default: ''
    },
    cnicOrNtn: {
      type: String,
      trim: true,
      default: '' // Kept private, visible only to admin for verification
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending'
    },
    rejectionReason: {
      type: String,
      default: ''
    },
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

// Index for city and category searches
vendorProfileSchema.index({ city: 1, verificationStatus: 1 });
vendorProfileSchema.index({ businessName: 'text', description: 'text' });

const VendorProfile = model('VendorProfile', vendorProfileSchema);

export default VendorProfile;
