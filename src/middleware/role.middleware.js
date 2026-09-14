import AppError from "../utils/AppError.js";

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("يجب تسجيل الدخول", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("ليس لديك صلاحية لتنفيذ هذا الإجراء", 403));
    }

    next();
  };
};

export default roleMiddleware;
