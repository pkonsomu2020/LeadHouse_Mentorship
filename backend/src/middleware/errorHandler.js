/**
 * Global error handler — catches anything passed to next(err)
 * Never leaks stack traces or internal details in production.
 */
function errorHandler(err, req, res, next) {
  const isProd  = process.env.NODE_ENV === 'production';
  const status  = err.status || err.statusCode || 500;

  // Always log internally
  console.error(`[ERROR] ${req.method} ${req.path} → ${status}: ${err.message}`);

  // Generic message for 500s in production — never expose internals
  const message = (status === 500 && isProd)
    ? 'An unexpected error occurred. Please try again.'
    : err.message || 'Internal server error';

  res.status(status).json({
    error: message,
    // Only include stack in development
    ...((!isProd && err.stack) && { stack: err.stack }),
  });
}

module.exports = errorHandler;
