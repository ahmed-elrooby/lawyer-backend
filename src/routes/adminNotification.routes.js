import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import {
  deleteAdminNotification,
  getAdminUnreadCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
} from "../controller/adminNotification.controller.js";
import { getNotifications } from "../controller/notification.controller.js";

const adminNotificationRouter = express.Router();

adminNotificationRouter.get(
  "/admin/notifications",
  authMiddleware,
  roleMiddleware("admin"),
  getNotifications,
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
adminNotificationRouter.delete(
  "/admin/notifications/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteAdminNotification,
);

export default adminNotificationRouter;
