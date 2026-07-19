/**
 * ACE Web Portal — Custom Application Error
 *
 * Extends the native Error with an HTTP statusCode and an `isOperational` flag.
 * Operational errors (e.g., 404, 400) are expected and safe to expose to clients.
 * Programming errors (unexpected throws) are caught by the global handler and NOT exposed.
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message (may be sent to client in dev)
   * @param {number} statusCode - HTTP status code (e.g., 400, 401, 403, 404, 500)
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Preserve the original stack trace, excluding this constructor frame
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
