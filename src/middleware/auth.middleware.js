import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "يجب تسجيل الدخول" });
    const [type, token] = authHeader.split(" ");
    console.log("type", type);
    console.log("token", token);
    if (type !== "Bearer" || !token)
      return res.status(401).json({ message: "يجب تسجيل الدخول" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    req.user = decoded;
    next();
  } catch (e) {
    console.log("JWT Error:", e.message);

    return res.status(401).json({
      message: "Token غير صالح أو منتهي الصلاحية",
    });
  }
};

export default authMiddleware;
