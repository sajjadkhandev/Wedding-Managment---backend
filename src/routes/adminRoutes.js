import express from 'express';
import {
  getAllVendorsForAdmin,
  verifyVendor,
  getAdminStats,
  getAuditLogs
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Enforce authentication & Administrator role across all admin routes
router.use(protect);
router.use(authorize(ROLES.ADMIN));

router.get('/stats', getAdminStats);
router.get('/vendors', getAllVendorsForAdmin);
router.patch('/vendors/:id/verify', verifyVendor);
router.get('/audit-logs', getAuditLogs);

export default router;
