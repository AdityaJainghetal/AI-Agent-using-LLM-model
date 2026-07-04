module.exports = function errorHandler(err, _req, res, _next) {
  console.error('🔥', err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
};
