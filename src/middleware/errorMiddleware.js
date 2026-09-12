const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "حدث خطأ في السيرفر";

  // MongoDB ObjectId غير صالح
  if (err.name === "CastError") {
    statusCode = 400;
    message = "معرف غير صالح";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorMiddleware;
