import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "../controller/notification.controller.js";
import roleMiddleware from "../middleware/role.middleware.js";

const notificationRouter = express.Router();

notificationRouter.get(
  "/notifications",
  authMiddleware,
  roleMiddleware("office_owner", "lawyer"),
  getNotifications,
);

notificationRouter.get(
  "/notifications/unread-count",
  authMiddleware,
  roleMiddleware("office_owner", "lawyer"),
  getUnreadCount,
);

notificationRouter.patch(
  "/notifications/:id/read",
  authMiddleware,
  roleMiddleware("office_owner", "lawyer"),
  markAsRead,
);

notificationRouter.patch(
  "/notifications/read-all",
  authMiddleware,
  roleMiddleware("office_owner", "lawyer"),
  markAllAsRead,
);

export default notificationRouter;
