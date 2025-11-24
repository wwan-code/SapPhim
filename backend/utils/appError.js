/**
 * Custom Error class for handling application-specific errors with HTTP status codes.
 * This allows the central error handling middleware to return appropriate responses.
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Mark as operational error
    this.errorCode = errorCode; // Custom error code for frontend handling

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
