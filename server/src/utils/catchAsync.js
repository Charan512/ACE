/**
 * ACE ERP — Async Route Wrapper
 *
 * Wraps an async Express handler so that any rejected promise is forwarded
 * to next(err) automatically — eliminating boilerplate try/catch in every controller.
 *
 * Usage:
 *   router.post('/route', catchAsync(async (req, res, next) => { ... }));
 *
 * @param {Function} fn - Async Express route handler
 * @returns {Function} Express middleware that catches async errors
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default catchAsync;
