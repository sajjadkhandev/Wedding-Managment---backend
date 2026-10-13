import express from 'express';
import {
  getVendors,
  getVendorById,
  getMyVendorProfile,
  updateMyVendorProfile
} from '../controllers/vendorController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Vendor Self-Management (Must be before /:id)
router.get('/profile/me', protect, authorize(ROLES.VENDOR), getMyVendorProfile);
router.put('/profile/me', protect, authorize(ROLES.VENDOR), updateMyVendorProfile);

// Public Vendor Directory
router.get('/', getVendors);
router.get('/:id', getVendorById);

export default router;
