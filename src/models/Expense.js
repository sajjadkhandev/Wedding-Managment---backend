import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export const EXPENSE_CATEGORIES = [
  'venue',
  'catering',
  'photography',
  'car_rental',
  'decor',
  'attire',
  'jewellery',
  'invitations',
  'music',
  'miscellaneous'
];

const expenseSchema = new Schema(
  {
    weddingProject: {
      type: Schema.Types.ObjectId,
      ref: 'WeddingProject',
      required: true,
      index: true
    },
    category: {
      type: String,
      enum: {
        values: EXPENSE_CATEGORIES,
        message: '{VALUE} is not a valid expense category'
      },
      required: [true, 'Expense category is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true
    },
    estimatedCostPKR: {
      type: Number,
      required: [true, 'Estimated cost in PKR is required'],
      min: [0, 'Cost cannot be negative']
    },
    actualCostPKR: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative']
    },
    paidAmountPKR: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative']
    },
    status: {
      type: String,
      enum: ['planned', 'deposit_paid', 'fully_paid', 'cancelled'],
      default: 'planned',
      index: true
    },
    vendorBooking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking'
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'cheque', 'other'],
      default: 'bank_transfer'
    },
    dueDate: {
      type: Date
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

expenseSchema.index({ weddingProject: 1, category: 1 });

export const Expense = model('Expense', expenseSchema);
export default Expense;
