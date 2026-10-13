import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { PAYMENT_STATUS, ROLES } from '../config/constants.js';

// Fallback in-memory payments for offline development / test runner
const FALLBACK_PAYMENTS = [
  {
    _id: 'pay-demo-1',
    paymentNumber: 'WP-PAY-819201',
    invoiceNumber: 'WP-INV-819201',
    booking: {
      _id: 'bk-demo-1',
      bookingNumber: 'WP-BK-829101',
      eventName: 'Baraat',
      eventDate: new Date('2026-11-20'),
      totalAmountPKR: 350000
    },
    customer: { _id: 'cust-demo', name: 'Hassan Khan', email: 'customer@wedplan.pk' },
    vendor: { _id: 'vp-demo', businessName: 'The Royal Crystal Ballroom', city: 'Lahore' },
    amountPKR: 70000,
    paymentType: 'advance_deposit',
    paymentMethod: 'bank_transfer',
    transactionReference: 'HBL-PK92-0928172648',
    status: PAYMENT_STATUS.PAID,
    notes: '20% advance booking deposit received via online bank transfer.',
    createdAt: new Date('2026-10-03')
  },
  {
    _id: 'pay-demo-2',
    paymentNumber: 'WP-PAY-918234',
    invoiceNumber: 'WP-INV-918234',
    booking: {
      _id: 'bk-demo-2',
      bookingNumber: 'WP-BK-918234',
      eventName: 'Baraat',
      eventDate: new Date('2026-11-20'),
      totalAmountPKR: 95000
    },
    customer: { _id: 'cust-demo', name: 'Hassan Khan', email: 'customer@wedplan.pk' },
    vendor: { _id: 'vp-demo-2', businessName: 'Executive Bridal Limousines', city: 'Lahore' },
    amountPKR: 20000,
    paymentType: 'advance_deposit',
    paymentMethod: 'easypaisa',
    transactionReference: 'EP-9182736451',
    status: PAYMENT_STATUS.PAID,
    notes: 'Advance car booking deposit via EasyPaisa wallet.',
    createdAt: new Date('2026-10-05')
  }
];

export const generateInvoiceNumber = () => {
  return `WP-INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
};

export const generatePaymentNumber = () => {
  return `WP-PAY-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
};

/**
 * @route   POST /api/v1/payments
 * @desc    Record a manual/installment payment for a booking
 * @access  Private (Customer, Vendor, Admin)
 */
export const recordPayment = asyncHandler(async (req, res) => {
  const {
    bookingId,
    amountPKR,
    paymentType = 'advance_deposit',
    paymentMethod = 'bank_transfer',
    transactionReference = '',
    notes = ''
  } = req.body;

  if (!bookingId) throw ApiError.badRequest('Booking ID is required');
  if (!amountPKR || amountPKR <= 0) throw ApiError.badRequest('Valid payment amount in PKR is required');

  if (mongoose.connection.readyState !== 1) {
    const payment = {
      _id: `pay-demo-${Date.now()}`,
      paymentNumber: generatePaymentNumber(),
      invoiceNumber: generateInvoiceNumber(),
      booking: { _id: bookingId, bookingNumber: 'WP-BK-DEMO', totalAmountPKR: Number(amountPKR) },
      customer: { _id: req.user?._id || 'cust-demo', name: req.user?.name || 'Customer' },
      vendor: { _id: 'vp-demo', businessName: 'WedPlan Partner' },
      amountPKR: Number(amountPKR),
      paymentType,
      paymentMethod,
      transactionReference: transactionReference || 'ONLINE-TRX-001',
      status: PAYMENT_STATUS.PAID,
      notes,
      createdAt: new Date()
    };
    FALLBACK_PAYMENTS.unshift(payment);
    return ApiResponse.created(res, { payment }, 'Payment recorded and invoice generated');
  }

  const booking = await Booking.findById(bookingId).populate('vendor');
  if (!booking) throw ApiError.notFound('Booking not found');

  const invoiceNumber = generateInvoiceNumber();
  const paymentNumber = generatePaymentNumber();

  const payment = await Payment.create({
    paymentNumber,
    invoiceNumber,
    booking: booking._id,
    customer: booking.customer,
    vendor: booking.vendor._id,
    amountPKR: Number(amountPKR),
    paymentType,
    paymentMethod,
    transactionReference,
    status: PAYMENT_STATUS.PAID,
    verifiedBy: req.user._id,
    notes
  });

  // Update booking payment record
  booking.advanceDepositPKR = (booking.advanceDepositPKR || 0) + Number(amountPKR);
  if (booking.advanceDepositPKR >= booking.totalAmountPKR) {
    booking.paymentStatus = PAYMENT_STATUS.PAID;
  } else {
    booking.paymentStatus = PAYMENT_STATUS.PROCESSING;
  }
  await booking.save();

  return ApiResponse.created(res, { payment }, 'Payment recorded successfully');
});

/**
 * @route   GET /api/v1/payments
 * @desc    Get payments history for authenticated user (Customer sees theirs, Vendor theirs, Admin sees all)
 * @access  Private
 */
export const getMyPayments = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const totalPaid = FALLBACK_PAYMENTS.reduce((acc, p) => acc + (p.amountPKR || 0), 0);
    return ApiResponse.ok(res, {
      payments: FALLBACK_PAYMENTS,
      totalCount: FALLBACK_PAYMENTS.length,
      totalPaidPKR: totalPaid
    }, 'Payments retrieved');
  }

  const query = {};
  if (req.user.role === ROLES.CUSTOMER) {
    query.customer = req.user._id;
  } else if (req.user.role === ROLES.VENDOR) {
    // find vendor profile
    query.vendor = req.user._id;
  }

  const payments = await Payment.find(query)
    .populate('booking', 'bookingNumber eventName eventDate totalAmountPKR')
    .populate('vendor', 'businessName city')
    .populate('customer', 'name email')
    .sort({ createdAt: -1 });

  const totalPaid = payments.reduce((acc, p) => acc + (p.amountPKR || 0), 0);

  return ApiResponse.ok(res, {
    payments,
    totalCount: payments.length,
    totalPaidPKR: totalPaid
  }, 'Payments retrieved successfully');
});

/**
 * @route   GET /api/v1/payments/:id/invoice
 * @desc    Get printable invoice data payload
 * @access  Private
 */
export const getPaymentInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const p = FALLBACK_PAYMENTS.find(pay => pay._id === id || pay.invoiceNumber === id) || FALLBACK_PAYMENTS[0];
    return ApiResponse.ok(res, { invoice: p }, 'Invoice retrieved');
  }

  const payment = await Payment.findById(id)
    .populate('booking')
    .populate('vendor', 'businessName city address phone')
    .populate('customer', 'name email phone');

  if (!payment) throw ApiError.notFound('Payment record or invoice not found');

  return ApiResponse.ok(res, { invoice: payment }, 'Invoice retrieved successfully');
});
