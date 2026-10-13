import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Protect Middleware — Verifies JWT from HTTP-only cookie or Authorization header
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check for token in secure HTTP-only cookies
  if (req.cookies && req.cookies.wedplan_token) {
    token = req.cookies.wedplan_token;
  }
  // 2. Check for token in Authorization Bearer header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('Not authenticated. Please log in to access this resource.');
  }

  try {
    const secret = process.env.JWT_SECRET || 'wedplan_dev_secret_key_pk_2026_super_secure_auth_token';
    const decoded = jwt.verify(token, secret);

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      throw ApiError.unauthorized('The user belonging to this token no longer exists.');
    }

    if (currentUser.status === 'suspended') {
      throw ApiError.forbidden('Your account has been suspended. Please contact WedPlan administration.');
    }

    // Attach authenticated user to request object
    req.user = currentUser;
    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.unauthorized('Invalid or expired authentication token.');
  }
});

/**
 * Authorize Middleware — Enforces Role-Based Access Control (RBAC)
 * @param  {...string} roles - Permitted roles (e.g. 'customer', 'vendor', 'admin')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(`Access forbidden: Role '${req.user?.role || 'guest'}' does not have permission.`)
      );
    }
    next();
  };
};

export default { protect, authorize };
