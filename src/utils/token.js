import jwt from 'jsonwebtoken';
import ApiResponse from './ApiResponse.js';

/**
 * Generate a signed JWT token
 */
export const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'wedplan_dev_secret_key_pk_2026_super_secure_auth_token';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id: userId }, secret, {
    expiresIn
  });
};

/**
 * Generate token, set secure HTTP-only cookie, and send JSON response
 */
export const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);

  const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRES_IN_DAYS || '7', 10);
  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true, // Prevents client-side JS from reading cookie (XSS protection)
    secure: process.env.NODE_ENV === 'production', // Use HTTPS only in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };

  res.cookie('wedplan_token', token, cookieOptions);

  return res.status(statusCode).json(
    new ApiResponse(
      statusCode,
      {
        user,
        token
      },
      message
    )
  );
};

/**
 * Clear authentication cookie
 */
export const clearTokenCookie = (res) => {
  res.cookie('wedplan_token', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
};
