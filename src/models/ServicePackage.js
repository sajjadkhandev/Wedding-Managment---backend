import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const servicePackageSchema = new Schema(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceListing',
      required: true,
      index: true
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'VendorProfile',
      required: true,
      index: true
    },
    packageName: {
      type: String,
      required: [true, 'Package name is required'],
      trim: true
    },
    pricePKR: {
      type: Number,
      required: [true, 'Package price in PKR is required'],
      min: [0, 'Package price cannot be negative']
    },
    priceUnit: {
      type: String,
      default: 'per event'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    includedItems: [
      {
        type: String
      }
    ],
    excludedItems: [
      {
        type: String
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const ServicePackage = model('ServicePackage', servicePackageSchema);

export default ServicePackage;
