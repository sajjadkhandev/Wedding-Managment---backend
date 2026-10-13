import express from 'express';
import ApiResponse from '../utils/ApiResponse.js';
import { getDBStatus } from '../config/db.js';

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    API Health Check & Diagnostics
 * @access  Public
 */
router.get('/', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: getDBStatus(),
    environment: process.env.NODE_ENV || 'development',
    currency: process.env.DEFAULT_CURRENCY || 'PKR',
    region: 'Pakistan',
    version: '1.0.0'
  };

  return ApiResponse.ok(res, healthData, 'WedPlan API is operational');
});

export default router;
