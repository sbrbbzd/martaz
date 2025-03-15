/**
 * Base error class for API errors
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error for when a resource is not found (404)
 */
class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

/**
 * Error for validation failures (400)
 */
class ValidationError extends ApiError {
  constructor(message = 'Validation failed') {
    super(400, message);
  }
}

/**
 * Error for authentication failures (401)
 */
class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super(401, message);
  }
}

/**
 * Error for authorization failures (403)
 */
class ForbiddenError extends ApiError {
  constructor(message = 'Access forbidden') {
    super(403, message);
  }
}

/**
 * Error for conflict situations (409)
 */
class ConflictError extends ApiError {
  constructor(message = 'Conflict occurred') {
    super(409, message);
  }
}

/**
 * Error for rate limiting (429)
 */
class RateLimitError extends ApiError {
  constructor(message = 'Too many requests') {
    super(429, message);
  }
}

/**
 * Error for server failures (500)
 */
class ServerError extends ApiError {
  constructor(message = 'Internal server error') {
    super(500, message);
  }
}

module.exports = {
  ApiError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  ServerError
}; 