import express from 'express';
import {
  getVendorReviews,
  createReview,
  replyToReview
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Public route to view vendor reviews
router.get('/vendor/:vendorId', getVendorReviews);

// Protected routes
router.use(protect);

router.post('/', authorize(ROLES.CUSTOMER, ROLES.ADMIN), createReview);
router.post('/:id/reply', authorize(ROLES.VENDOR, ROLES.ADMIN), replyToReview);

export default router;
