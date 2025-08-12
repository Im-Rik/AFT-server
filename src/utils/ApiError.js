class ApiError extends Error {
  /**
   * @param {number} statusCode - The HTTP status code.
   * @param {string} message - The error message.
   * @param {Array} errors - An optional array of detailed errors.
   * @param {string} stack - The error stack trace.
   */
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };