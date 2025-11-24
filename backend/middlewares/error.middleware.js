const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? (err.statusCode || 500) : res.statusCode;
  res.status(statusCode);
  
  // Standardized error response format
  res.json({
    success: false,
    message: err.message || 'Đã xảy ra lỗi không xác định.',
    code: err.errorCode || null,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    errors: err.errors || null,
  });
};

export { errorHandler };
