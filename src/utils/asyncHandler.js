/**
 * Wraps an asynchronous function to catch any errors and pass them to the next middleware.
 * @param {Function} requestHandler - The asynchronous controller function.
 * @returns {Function} An Express route handler.
 */

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };