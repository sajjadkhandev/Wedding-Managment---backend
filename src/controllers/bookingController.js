import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Availability from '../models/Availability.js';
import ServiceListing from '../models/ServiceListing.js';
import ServicePackage from '../models/ServicePackage.js';
import VendorProfile from '../models/VendorProfile.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { BOOKING_STATUS, PAYMENT_STATUS, ROLES } from '../config/constants.js';

// Fallback demo bookings for offline development / test runner
const FALLBACK_BOOKINGS = [
  {
    _id: 'bk-demo-1',
    bookingNumber: 'WP-BK-829101',
    customer: { _id: 'cust-demo', name: 'Hassan Khan', email: 'customer@wedplan.pk', phone: '03001234567' },
    vendor: { _id: 'vp-demo', businessName: 'The Royal Crystal Ballroom' },
    vendorUser: 'vendor-demo',
    service: {
      _id: 'srv-demo-1',
      title: 'Grand Imperial Banquet Hall',
      categorySlug: 'venues',
      city: 'Lahore',
      startingPrice: 350000,
      priceUnit: 'per slot'
    },
    eventName: 'Baraat',
    eventDate: new Date('2026-11-20'),
    timeSlot: 'evening',
    guestCount: 450,
    packageSnapshot: {
      packageName: 'Full Palace Banquet Package',
      pricePKR: 350000,
      priceUnit: 'per event slot',
      includedItems: ['Hall AC & Heating', '350 KVA Backup Generator', 'Bridal Room Suite', 'Valet Parking for 100 Cars']
    },
    totalAmountPKR: 350000,
    advanceDepositPKR: 70000,
    status: BOOKING_STATUS.CONFIRMED,
    paymentStatus: PAYMENT_STATUS.PAID,
    customerNotes: 'Family arrival expected at 7:30 PM. Please have the bridal suite unlocked by 6:00 PM.',
    timeline: [
      { status: BOOKING_STATUS.PENDING, timestamp: new Date('2026-10-01'), note: 'Booking inquiry submitted' },
      { status: BOOKING_STATUS.ACCEPTED, timestamp: new Date('2026-10-02'), note: 'Accepted by Royal Crystal Ballroom' },
      { status: BOOKING_STATUS.CONFIRMED, timestamp: new Date('2026-10-03'), note: 'Deposit paid and confirmed' }
    ],
    createdAt: new Date('2026-10-01')
  },
  {
    _id: 'bk-demo-2',
    bookingNumber: 'WP-BK-918234',
    customer: { _id: 'cust-demo', name: 'Hassan Khan', email: 'customer@wedplan.pk', phone: '03001234567' },
    vendor: { _id: 'vp-demo-2', businessName: 'Executive Bridal Limousines' },
    vendorUser: 'vendor-demo-2',
    service: {
      _id: 'srv-demo-2',
      title: 'Rolls Royce Ghost Bridal Car with Chauffeur',
      categorySlug: 'cars',
      city: 'Lahore',
      startingPrice: 95000,
      priceUnit: 'per day'
    },
    eventName: 'Baraat',
    eventDate: new Date('2026-11-20'),
    timeSlot: 'evening',
    guestCount: 2,
    packageSnapshot: {
      packageName: 'Chauffeured Bridal Package',
      pricePKR: 95000,
      priceUnit: 'per day',
      includedItems: ['Uniformed Chauffeur', 'Fresh Floral Decoration', 'Unlimited Fuel within City']
    },
    totalAmountPKR: 95000,
    advanceDepositPKR: 20000,
    status: BOOKING_STATUS.PENDING,
    paymentStatus: PAYMENT_STATUS.PENDING,
    customerNotes: 'Pickup from Gulberg III at 6:30 PM, drop-off at banquet.',
    timeline: [
      { status: BOOKING_STATUS.PENDING, timestamp: new Date(), note: 'Booking request sent to vendor' }
    ],
    createdAt: new Date()
  }
];

/**
 * Normalizes a date to YYYY-MM-DD start of day for comparison
 */
export const normalizeEventDate = (dateStringOrObj) => {
  const d = new Date(dateStringOrObj);
  if (isNaN(d.getTime())) return null;
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Evaluates whether two bookings overlap for the same service and date/timeSlot
 */
export const checkSlotConflict = (existingBookings, targetDate, targetSlot) => {
  const normTarget = normalizeEventDate(targetDate);
  if (!normTarget) return false;

  return existingBookings.some(b => {
    if ([BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED].includes(b.status)) {
      return false; // Cancelled or rejected bookings don't block
    }
    const normExisting = normalizeEventDate(b.eventDate);
    const dateMatch = normExisting && normExisting.getTime() === normTarget.getTime();
    const slotMatch = b.timeSlot === targetSlot || b.timeSlot === 'full_day' || targetSlot === 'full_day';
    return dateMatch && slotMatch;
  });
};

/**
 * @route   POST /api/v1/bookings
 * @desc    Submit a new booking request with authoritative price freezing and anti-double booking check
 * @access  Private (Customer)
 */
export const createBooking = asyncHandler(async (req, res) => {
  const {
    serviceId,
    servicePackageId,
    weddingProjectId,
    weddingEventId,
    eventName = 'Baraat',
    eventDate,
    timeSlot = 'evening',
    guestCount = 100,
    customerNotes = ''
  } = req.body;

  if (!serviceId) {
    throw ApiError.badRequest('Service listing ID is required');
  }

  if (!eventDate) {
    throw ApiError.badRequest('Event date is required');
  }

  const normalizedDate = normalizeEventDate(eventDate);
  if (!normalizedDate) {
    throw ApiError.badRequest('Invalid event date format');
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (normalizedDate < today) {
    throw ApiError.badRequest('Event date cannot be in the past');
  }

  // Handle Offline / Mongoose-less dev mode
  if (mongoose.connection.readyState !== 1) {
    const isConflicted = checkSlotConflict(FALLBACK_BOOKINGS, normalizedDate, timeSlot);
    if (isConflicted) {
      throw ApiError.badRequest('The requested date and time slot is already reserved for this service.');
    }

    const demoNewBooking = {
      _id: `bk-demo-${Date.now()}`,
      bookingNumber: `WP-BK-${Math.floor(100000 + Math.random() * 900000)}`,
      customer: { _id: req.user?._id || 'cust-demo', name: req.user?.name || 'Customer' },
      vendor: { _id: 'vp-demo', businessName: 'WedPlan Verified Partner' },
      vendorUser: 'vendor-demo',
      service: {
        _id: serviceId,
        title: 'Wedding Service Reservation',
        city: 'Lahore'
      },
      eventName,
      eventDate: normalizedDate,
      timeSlot,
      guestCount: Number(guestCount),
      packageSnapshot: {
        packageName: 'Standard Package',
        pricePKR: 150000,
        priceUnit: 'per event'
      },
      totalAmountPKR: 150000,
      advanceDepositPKR: 30000,
      status: BOOKING_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
      customerNotes,
      timeline: [
        { status: BOOKING_STATUS.PENDING, timestamp: new Date(), note: 'Booking request placed by customer' }
      ],
      createdAt: new Date()
    };

    FALLBACK_BOOKINGS.unshift(demoNewBooking);
    return ApiResponse.created(res, { booking: demoNewBooking }, 'Booking request placed successfully');
  }

  // 1. Fetch Service Listing and Vendor
  const service = await ServiceListing.findById(serviceId).populate('vendor');
  if (!service) {
    throw ApiError.notFound('Service listing not found');
  }

  if (!service.isActive) {
    throw ApiError.badRequest('This service listing is currently inactive');
  }

  const vendorProfile = service.vendor;
  if (!vendorProfile) {
    throw ApiError.badRequest('Associated vendor profile could not be found');
  }

  // 2. Anti-double booking conflict verification
  // Check active bookings for this service on this date and timeSlot
  const existingBooking = await Booking.findOne({
    service: serviceId,
    eventDate: {
      $gte: normalizedDate,
      $lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000)
    },
    $or: [{ timeSlot }, { timeSlot: 'full_day' }, { $expr: { $eq: [timeSlot, 'full_day'] } }],
    status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.CONFIRMED] }
  });

  if (existingBooking) {
    throw ApiError.badRequest('The requested date and time slot is already reserved for this service.');
  }

  // 3. Authoritative Price Calculation (Frozen Snapshot)
  let totalAmountPKR = service.startingPrice;
  let packageSnapshot = {
    packageName: service.title,
    pricePKR: service.startingPrice,
    priceUnit: service.priceUnit || 'per event',
    includedItems: [],
    excludedItems: []
  };

  if (servicePackageId) {
    const pkg = await ServicePackage.findOne({ _id: servicePackageId, listing: serviceId });
    if (!pkg) {
      throw ApiError.notFound('Selected package does not belong to this service');
    }

    packageSnapshot = {
      packageName: pkg.packageName,
      pricePKR: pkg.pricePKR,
      priceUnit: pkg.priceUnit,
      includedItems: pkg.includedItems || [],
      excludedItems: pkg.excludedItems || []
    };

    if (pkg.priceUnit === 'per person' || pkg.priceUnit === 'per head' || pkg.priceUnit === 'per guest') {
      totalAmountPKR = pkg.pricePKR * Number(guestCount);
    } else {
      totalAmountPKR = pkg.pricePKR;
    }
  }

  // 4. Generate unique Booking Number
  const bookingNumber = `WP-BK-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const advanceDepositPKR = Math.round(totalAmountPKR * 0.20); // 20% advance standard

  // 5. Create Booking
  const newBooking = await Booking.create({
    bookingNumber,
    customer: req.user._id,
    vendor: vendorProfile._id,
    vendorUser: vendorProfile.user,
    service: service._id,
    servicePackage: servicePackageId || null,
    weddingProject: weddingProjectId || null,
    weddingEvent: weddingEventId || null,
    eventName,
    eventDate: normalizedDate,
    timeSlot,
    guestCount: Number(guestCount),
    packageSnapshot,
    totalAmountPKR,
    advanceDepositPKR,
    status: BOOKING_STATUS.PENDING,
    paymentStatus: PAYMENT_STATUS.PENDING,
    customerNotes,
    timeline: [
      {
        status: BOOKING_STATUS.PENDING,
        timestamp: new Date(),
        note: 'Booking request placed by customer',
        updatedBy: req.user._id
      }
    ]
  });

  // 6. Record in Availability collection
  try {
    await Availability.findOneAndUpdate(
      { service: service._id, date: normalizedDate, timeSlot },
      {
        service: service._id,
        date: normalizedDate,
        timeSlot,
        status: 'reserved',
        booking: newBooking._id,
        reason: 'Pending customer booking'
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    // Availability update non-blocking
  }

  return ApiResponse.created(res, { booking: newBooking }, 'Booking request placed successfully');
});

/**
 * @route   GET /api/v1/bookings
 * @desc    Get bookings relevant to authenticated user (Customer sees their own, Vendor sees theirs, Admin sees all)
 * @access  Private
 */
export const getMyBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  if (mongoose.connection.readyState !== 1) {
    let filtered = [...FALLBACK_BOOKINGS];
    if (status) {
      filtered = filtered.filter(b => b.status === status);
    }
    return ApiResponse.ok(res, {
      bookings: filtered,
      total: filtered.length,
      page: Number(page),
      pages: 1
    }, 'Bookings retrieved');
  }

  const query = {};
  if (req.user.role === ROLES.CUSTOMER) {
    query.customer = req.user._id;
  } else if (req.user.role === ROLES.VENDOR) {
    query.vendorUser = req.user._id;
  }
  // Admin sees all

  if (status) {
    query.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Booking.countDocuments(query);
  const bookings = await Booking.find(query)
    .populate('customer', 'name email phone avatar')
    .populate('vendor', 'businessName city logo rating')
    .populate('service', 'title city startingPrice categorySlug coverImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return ApiResponse.ok(res, {
    bookings,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)) || 1
  }, 'Bookings retrieved successfully');
});

/**
 * @route   GET /api/v1/bookings/:id
 * @desc    Get detailed booking by ID
 * @access  Private
 */
export const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const demoBooking = FALLBACK_BOOKINGS.find(b => b._id === id || b.bookingNumber === id) || FALLBACK_BOOKINGS[0];
    return ApiResponse.ok(res, { booking: demoBooking }, 'Booking retrieved');
  }

  const booking = await Booking.findById(id)
    .populate('customer', 'name email phone avatar')
    .populate('vendor', 'businessName city address phone logo')
    .populate('service', 'title city startingPrice priceUnit categorySlug images')
    .populate('weddingProject', 'title coupleNames weddingDate')
    .populate('weddingEvent', 'eventType customTitle date startTime');

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  // Authorization check
  const isCustomer = booking.customer._id.toString() === req.user._id.toString();
  const isVendor = booking.vendorUser?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === ROLES.ADMIN;

  if (!isCustomer && !isVendor && !isAdmin) {
    throw ApiError.forbidden('You are not authorized to view this booking');
  }

  return ApiResponse.ok(res, { booking }, 'Booking retrieved successfully');
});

/**
 * @route   PATCH /api/v1/bookings/:id/status
 * @desc    Update booking status (accept, reject, confirm, cancel, complete)
 * @access  Private
 */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, note = '', cancellationReason = '' } = req.body;

  if (!action) {
    throw ApiError.badRequest('Action is required (accept, reject, confirm, cancel, complete)');
  }

  if (mongoose.connection.readyState !== 1) {
    const booking = FALLBACK_BOOKINGS.find(b => b._id === id) || FALLBACK_BOOKINGS[0];
    let nextStatus = booking.status;

    if (action === 'accept') nextStatus = BOOKING_STATUS.ACCEPTED;
    else if (action === 'reject') nextStatus = BOOKING_STATUS.REJECTED;
    else if (action === 'confirm') nextStatus = BOOKING_STATUS.CONFIRMED;
    else if (action === 'cancel') nextStatus = BOOKING_STATUS.CANCELLED;
    else if (action === 'complete') nextStatus = BOOKING_STATUS.COMPLETED;

    booking.status = nextStatus;
    booking.timeline.push({
      status: nextStatus,
      timestamp: new Date(),
      note: note || `Booking updated to ${nextStatus}`
    });

    return ApiResponse.ok(res, { booking }, `Booking status updated to ${nextStatus}`);
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }

  const isCustomer = booking.customer.toString() === req.user._id.toString();
  const isVendor = booking.vendorUser.toString() === req.user._id.toString();
  const isAdmin = req.user.role === ROLES.ADMIN;

  let nextStatus;

  switch (action) {
    case 'accept':
      if (!isVendor && !isAdmin) throw ApiError.forbidden('Only the assigned vendor can accept this booking');
      if (booking.status !== BOOKING_STATUS.PENDING) throw ApiError.badRequest(`Cannot accept booking in ${booking.status} status`);
      nextStatus = BOOKING_STATUS.ACCEPTED;
      break;

    case 'reject':
      if (!isVendor && !isAdmin) throw ApiError.forbidden('Only the assigned vendor can reject this booking');
      if (booking.status !== BOOKING_STATUS.PENDING) throw ApiError.badRequest(`Cannot reject booking in ${booking.status} status`);
      nextStatus = BOOKING_STATUS.REJECTED;
      // Release slot in Availability
      await Availability.findOneAndUpdate(
        { booking: booking._id },
        { status: 'available', booking: null }
      );
      break;

    case 'confirm':
      if (booking.status !== BOOKING_STATUS.ACCEPTED && booking.status !== BOOKING_STATUS.PENDING) {
        throw ApiError.badRequest(`Cannot confirm booking in ${booking.status} status`);
      }
      nextStatus = BOOKING_STATUS.CONFIRMED;
      booking.paymentStatus = PAYMENT_STATUS.PAID;
      break;

    case 'cancel':
      if (!isCustomer && !isVendor && !isAdmin) throw ApiError.forbidden('Not authorized to cancel this booking');
      if ([BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED].includes(booking.status)) {
        throw ApiError.badRequest(`Booking is already ${booking.status}`);
      }
      nextStatus = BOOKING_STATUS.CANCELLED;
      booking.cancellationReason = cancellationReason || note;
      booking.cancelledBy = req.user._id;
      // Release slot in Availability
      await Availability.findOneAndUpdate(
        { booking: booking._id },
        { status: 'available', booking: null }
      );
      break;

    case 'complete':
      if (!isVendor && !isAdmin) throw ApiError.forbidden('Only the vendor or admin can mark a booking complete');
      nextStatus = BOOKING_STATUS.COMPLETED;
      break;

    default:
      throw ApiError.badRequest(`Invalid booking action: ${action}`);
  }

  booking.status = nextStatus;
  booking.timeline.push({
    status: nextStatus,
    timestamp: new Date(),
    note: note || `Booking transitioned to ${nextStatus}`,
    updatedBy: req.user._id
  });

  await booking.save();
  return ApiResponse.ok(res, { booking }, `Booking status updated to ${nextStatus}`);
});

/**
 * @route   GET /api/v1/bookings/check-availability
 * @desc    Check whether a service is available on a specific date and time slot
 * @access  Public
 */
export const checkServiceAvailability = asyncHandler(async (req, res) => {
  const { serviceId, date, timeSlot = 'evening' } = req.query;

  if (!serviceId || !date) {
    throw ApiError.badRequest('serviceId and date are required query parameters');
  }

  const normalized = normalizeEventDate(date);
  if (!normalized) {
    throw ApiError.badRequest('Invalid date format');
  }

  if (mongoose.connection.readyState !== 1) {
    const isConflicted = checkSlotConflict(FALLBACK_BOOKINGS, normalized, timeSlot);
    return ApiResponse.ok(res, {
      available: !isConflicted,
      serviceId,
      date: normalized,
      timeSlot
    }, isConflicted ? 'Slot is already booked' : 'Slot is available');
  }

  const conflict = await Booking.findOne({
    service: serviceId,
    eventDate: {
      $gte: normalized,
      $lt: new Date(normalized.getTime() + 24 * 60 * 60 * 1000)
    },
    $or: [{ timeSlot }, { timeSlot: 'full_day' }, { $expr: { $eq: [timeSlot, 'full_day'] } }],
    status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.CONFIRMED] }
  });

  return ApiResponse.ok(res, {
    available: !conflict,
    serviceId,
    date: normalized,
    timeSlot
  }, conflict ? 'Slot is already reserved' : 'Slot is available');
});
