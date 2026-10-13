import express from 'express';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  addPackage,
  getPackages
} from '../controllers/serviceController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Public routes
router.get('/', getServices);
router.get('/:id', getServiceById);
router.get('/:id/packages', getPackages);

// Vendor-protected routes
router.post('/', protect, authorize(ROLES.VENDOR), createService);
router.put('/:id', protect, authorize(ROLES.VENDOR), updateService);
router.delete('/:id', protect, authorize(ROLES.VENDOR), deleteService);
router.post('/:id/packages', protect, authorize(ROLES.VENDOR), addPackage);

export default router;
