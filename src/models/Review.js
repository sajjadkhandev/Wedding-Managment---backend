import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const reviewSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'VendorProfile',
      required: true,
      index: true
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceListing'
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking'
    },
    rating: {
      type: Number,
      required: [true, 'Rating score is required'],
      min: [1, 'Minimum rating is 1 star'],
      max: [5, 'Maximum rating is 5 stars']
    },
    title: {
      type: String,
      trim: true,
      default: ''
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true
    },
    isVerifiedBooking: {
      type: Boolean,
      default: false
    },
    isApproved: {
      type: Boolean,
      default: true,
      index: true
    },
    vendorReply: {
      text: { type: String, trim: true },
      repliedAt: { type: Date }
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.index({ vendor: 1, isApproved: 1, createdAt: -1 });

export const Review = model('Review', reviewSchema);
export default Review;
