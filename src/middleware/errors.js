function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Route not found'
  });
}

function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);

  if (res.headersSent) return next(err);

  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong'
  });
}

module.exports = { notFoundHandler, errorHandler };
