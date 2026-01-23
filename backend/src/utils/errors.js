/**
 * Custom Error Classes
 *
 * Provides specific error types for better error handling.
 */

/**
 * Base API Error class
 */
class APIError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Bad Request Error (400)
 */
class BadRequestError extends APIError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

/**
 * Unauthorized Error (401)
 */
class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * Forbidden Error (403)
 */
class ForbiddenError extends APIError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

/**
 * Not Found Error (404)
 */
class NotFoundError extends APIError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

/**
 * Conflict Error (409)
 */
class ConflictError extends APIError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

/**
 * Internal Server Error (500)
 */
class InternalServerError extends APIError {
  constructor(message = 'Internal Server Error') {
    super(message, 500);
  }
}

/**
 * Service Unavailable Error (503)
 */
class ServiceUnavailableError extends APIError {
  constructor(message = 'Service Unavailable') {
    super(message, 503);
  }
}

module.exports = {
  APIError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  ServiceUnavailableError
};
