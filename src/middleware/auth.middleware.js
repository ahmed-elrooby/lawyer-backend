import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError("يجب تسجيل الدخول", 401);
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      throw new AppError("يجب تسجيل الدخول", 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    console.log("JWT Error:", error.message);

    if (error instanceof AppError) {
      return next(error);
    }

    return next(new AppError("Token غير صالح أو منتهي الصلاحية", 401));
  }
};

export default authMiddleware;
