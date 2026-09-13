
const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "حدث خطأ في السيرفر";

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;

    const field = Object.keys(err.keyValue || {})[0];

    if (field === "email") {
      message = "البريد الإلكتروني مستخدم بالفعل";
    } else {
      message = "البيانات موجودة بالفعل";
    }
  }

  // MongoDB ObjectId غير صالح
  if (err.name === "CastError") {
    statusCode = 400;
    message = "معرف غير صالح";
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorMiddleware;

