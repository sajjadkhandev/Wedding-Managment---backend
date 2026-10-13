import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // If not already an ApiError, convert common library errors to ApiError
  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';

    // Mongoose bad ObjectId CastError
    if (error.name === 'CastError') {
      message = `Invalid format for resource identifier: ${error.value}`;
      statusCode = 400;
      error = new ApiError(statusCode, message);
    }
    // Mongoose Duplicate Key Error (e.g. unique email or booking clash)
    else if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || 'field';
      message = `Duplicate value entered for ${field}. Please use another value.`;
      statusCode = 409;
      error = new ApiError(statusCode, message);
    }
    // Mongoose Validation Error
    else if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((val) => val.message);
      message = `Validation Failed: ${messages.join(', ')}`;
      statusCode = 400;
      error = new ApiError(statusCode, message, messages);
    }
    // JWT Authentication Errors
    else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid authentication token. Please sign in again.';
      statusCode = 401;
      error = new ApiError(statusCode, message);
    } else if (error.name === 'TokenExpiredError') {
      message = 'Authentication token expired. Please sign in again.';
      statusCode = 401;
      error = new ApiError(statusCode, message);
    } else {
      error = new ApiError(statusCode, message, [], err.stack);
    }
  }

  // Log server errors for developer inspection
  if (error.statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - 500 Internal Error: ${error.message}`, error.stack);
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${error.statusCode} ${error.message}`);
  }

  const isProduction = process.env.NODE_ENV === 'production';

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || [],
    ...(isProduction ? {} : { stack: error.stack })
  };

  res.status(error.statusCode).json(response);
};

export default errorHandler;
