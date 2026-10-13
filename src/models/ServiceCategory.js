import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const serviceCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    tagline: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: 'Sparkles'
    },
    image: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const ServiceCategory = model('ServiceCategory', serviceCategorySchema);

export default ServiceCategory;
