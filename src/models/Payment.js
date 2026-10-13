import mongoose from 'mongoose';
const { Schema, model } = mongoose;
import { PAYMENT_STATUS } from '../config/constants.js';

const paymentSchema = new Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },
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
    amountPKR: {
      type: Number,
      required: [true, 'Payment amount in PKR is required'],
      min: [1, 'Amount must be at least 1 PKR']
    },
    paymentType: {
      type: String,
      enum: ['advance_deposit', 'balance_payment', 'full_payment', 'refund'],
      default: 'advance_deposit'
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'easypaisa', 'jazzcash', 'cash', 'card', 'cheque'],
      default: 'bank_transfer'
    },
    transactionReference: {
      type: String,
      trim: true,
      default: ''
    },
    proofDocument: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PAID,
      index: true
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ vendor: 1, createdAt: -1 });

export const Payment = model('Payment', paymentSchema);
export default Payment;
