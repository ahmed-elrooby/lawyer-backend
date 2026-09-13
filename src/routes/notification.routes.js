
import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  deleteNotification,
} from "../controller/notification.controller.js";

const notificationRouter = express.Router();

// جلب الإشعارات
notificationRouter.get(
  "/notifications",
  authMiddleware,
  roleMiddleware("admin", "office_owner", "lawyer"),
  getNotifications,
);

// عدد الإشعارات غير المقروءة
notificationRouter.get(
  "/notifications/unread-count",
  authMiddleware,
  roleMiddleware("admin", "office_owner", "lawyer"),
  getUnreadCount,
);

// تحديد إشعار كمقروء
notificationRouter.patch(
  "/notifications/:id/read",
  authMiddleware,
  roleMiddleware("admin", "office_owner", "lawyer"),
  markAsRead,
);

// تحديد كل الإشعارات كمقروءة
notificationRouter.patch(
  "/notifications/read-all",
  authMiddleware,
  roleMiddleware("admin", "office_owner", "lawyer"),
  markAllAsRead,
);

// حذف إشعار
notificationRouter.delete(
  "/notifications/:id",
  authMiddleware,
  roleMiddleware("admin", "office_owner", "lawyer"),
  deleteNotification,
);

export default notificationRouter;

