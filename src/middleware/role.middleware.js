const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    console.log("USER:", req.user);
    console.log("ROLE:", req.user?.role);
    console.log("ALLOWED:", allowedRoles);

    if (!req.user) {
      return res.status(401).json({
        message: "يجب تسجيل الدخول",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "ليس لديك صلاحية لتنفيذ هذا الإجراء",
        userRole: req.user.role,
        allowedRoles,
      });
    }

    next();
  };
};

export default roleMiddleware;
