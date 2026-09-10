import express from "express";

import getDashboardStatistics from "../controller/dashboard.controller.js";
import authMiddleware from "./../middleware/auth.middleware.js";
import roleMiddleware from "./../middleware/role.middleware.js";

const dashboardRouter = express.Router();

dashboardRouter.get(
  "/dashboard/statistics",
  authMiddleware,
  roleMiddleware("admin", "office_owner", "lawyer"),
  getDashboardStatistics,
);

export default dashboardRouter;
