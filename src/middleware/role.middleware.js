const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "يجب تسجيل الدخول" });
    if (!allowedRoles.includes(req.user.role))
      return res
        .status(403)
        .json({ message: "ليس لديك صلاحية لتنفيذ هذا الإجراء" });
    next();
  };
};
export default roleMiddleware;
