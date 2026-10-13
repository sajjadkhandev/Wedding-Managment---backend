import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  checkServiceAvailability
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Public route to check availability calendar
router.get('/check-availability', checkServiceAvailability);

// Authenticated booking operations
router.use(protect);

router.route('/')
  .post(authorize(ROLES.CUSTOMER, ROLES.ADMIN), createBooking)
  .get(getMyBookings);

router.route('/:id')
  .get(getBookingById);

router.patch('/:id/status', updateBookingStatus);

export default router;
