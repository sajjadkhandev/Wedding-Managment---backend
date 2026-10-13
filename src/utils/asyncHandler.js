/**
 * Async Route Handler Wrapper
 * Eliminates repetitive try-catch blocks in Express controllers.
 * Forwards any unhandled Promise rejections directly to the centralized error middleware.
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;
