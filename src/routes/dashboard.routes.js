import express from "express";

import {
  getDashboardStatistics,
  exportDashboardStatistics,
} from "../controller/dashboard.controller.js";

import authMiddleware from "./../middleware/auth.middleware.js";
import roleMiddleware from "./../middleware/role.middleware.js";

const dashboardRouter = express.Router();

dashboardRouter.get(
  "/dashboard/statistics",
  authMiddleware,
  roleMiddleware("admin", "office_owner", "lawyer"),
  getDashboardStatistics,
);

dashboardRouter.get(
  "/dashboard/statistics/export",
  authMiddleware,
  roleMiddleware("admin"),
  exportDashboardStatistics,
);

export default dashboardRouter;