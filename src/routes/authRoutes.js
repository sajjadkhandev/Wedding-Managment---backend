import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerCustomer,
  registerVendor,
  login,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Strict Rate Limiting for Authentication Attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per 15 minutes
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

// Public Authentication Endpoints
router.post('/register', authLimiter, registerCustomer);
router.post('/register-vendor', authLimiter, registerVendor);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);

// Private Authenticated Endpoints
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);

export default router;
