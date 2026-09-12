import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import {
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
} from "../controller/adminNotification.controller.js";

const adminNotificationRouter = express.Router();

adminNotificationRouter.get(
  "/admin/notifications",
  authMiddleware,
  roleMiddleware("admin"),
  getAdminNotifications,
);

adminNotificationRouter.get(
  "/admin/notifications/unread-count",
  authMiddleware,
  roleMiddleware("admin"),
  getAdminUnreadCount,
);

adminNotificationRouter.patch(
  "/admin/notifications/:id/read",
  authMiddleware,
  roleMiddleware("admin"),
  markAdminNotificationAsRead,
);

adminNotificationRouter.patch(
  "/admin/notifications/read-all",
  authMiddleware,
  roleMiddleware("admin"),
  markAllAdminNotificationsAsRead,
);

export default adminNotificationRouter;
