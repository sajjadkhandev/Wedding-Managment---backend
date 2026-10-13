import crypto from 'crypto';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendTokenResponse, clearTokenCookie } from '../utils/token.js';
import { ROLES } from '../config/constants.js';

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new Customer account
 * @access  Public
 */
export const registerCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, city, password } = req.body;

  if (!name || !email || !phone || !password) {
    throw ApiError.badRequest('Please provide all required fields: name, email, phone, and password.');
  }

  // Check for existing user
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists.');
  }

  // Force customer role (security check: prevent role injection)
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    city: city || 'Lahore',
    password,
    role: ROLES.CUSTOMER,
    status: 'active'
  });

  return sendTokenResponse(user, 201, res, 'Customer account registered successfully.');
});

/**
 * @route   POST /api/v1/auth/register-vendor
 * @desc    Register a new Vendor business account
 * @access  Public
 */
export const registerVendor = asyncHandler(async (req, res) => {
  const { businessName, contactPerson, email, phone, city, password } = req.body;

  if (!businessName || !email || !phone) {
    throw ApiError.badRequest('Please provide business name, email, and phone number.');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists.');
  }

  const user = await User.create({
    name: contactPerson || businessName,
    email: email.toLowerCase(),
    phone,
    city: city || 'Lahore',
    password: password || 'Vendor@123',
    role: ROLES.VENDOR,
    status: 'pending' // Pending administrative verification
  });

  return sendTokenResponse(user, 201, res, 'Vendor application registered. Pending admin verification.');
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Sign in user (Customer, Vendor, or Admin)
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest('Please provide both email and password.');
  }

  // Find user and explicitly select password field
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw ApiError.unauthorized('Invalid email or password credentials.');
  }

  if (user.status === 'suspended') {
    throw ApiError.forbidden('Your account has been suspended. Please contact platform support.');
  }

  return sendTokenResponse(user, 200, res, `Welcome back, ${user.name}!`);
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Log out current user and clear auth cookie
 * @access  Public
 */
export const logout = asyncHandler(async (req, res) => {
  clearTokenCookie(res);
  return ApiResponse.ok(res, null, 'Logged out successfully.');
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently authenticated user profile
 * @access  Private (Authenticated)
 */
export const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.ok(res, req.user, 'Current user profile retrieved.');
});

/**
 * @route   PATCH /api/v1/auth/profile
 * @desc    Update basic user profile details (Name, Phone, City, Avatar)
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, city, avatar } = req.body;

  const allowedUpdates = {};
  if (name) allowedUpdates.name = name;
  if (phone) allowedUpdates.phone = phone;
  if (city) allowedUpdates.city = city;
  if (avatar) allowedUpdates.avatar = avatar;

  const updatedUser = await User.findByIdAndUpdate(req.user._id, allowedUpdates, {
    new: true,
    runValidators: true
  });

  return ApiResponse.ok(res, updatedUser, 'Profile updated successfully.');
});

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Generate password reset token
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw ApiError.badRequest('Please provide your email address.');

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Return friendly generic response to prevent email enumeration
    return ApiResponse.ok(res, null, 'If this email is registered, reset instructions have been dispatched.');
  }

  // Generate random reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  await user.save({ validateBeforeSave: false });

  // In production with email configured, dispatch email.
  // For local development, return simulated token info:
  return ApiResponse.ok(
    res,
    { resetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined },
    'Password reset link generated successfully.'
  );
});

/**
 * @route   POST /api/v1/auth/reset-password/:token
 * @desc    Reset password using valid reset token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters long.');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw ApiError.badRequest('Password reset token is invalid or has expired.');
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return sendTokenResponse(user, 200, res, 'Password successfully reset.');
});
