import adminNotificationModel from "../models/adminNotification.model.js";
import AppError from "../utils/AppError.js";

// جلب إشعارات الـ Admin
const getAdminNotifications = async (req, res, next) => {
  try {
    const notifications = await adminNotificationModel
      .find()
      .populate("officeId", "name")
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "تم جلب إشعارات الإدارة بنجاح",
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// عدد الإشعارات غير المقروءة
const getAdminUnreadCount = async (req, res, next) => {
  try {
    const count = await adminNotificationModel.countDocuments({
      isRead: false,
    });

    return res.status(200).json({
      count,
    });
  } catch (error) {
    next(error);
  }
};

// تحديد إشعار كمقروء
const markAdminNotificationAsRead = async (req, res, next) => {
  const { id } = req.params;

  try {
    const notification = await adminNotificationModel.findByIdAndUpdate(
      id,
      {
        isRead: true,
      },
      {
        new: true,
      },
    );

    if (!notification) {
      throw new AppError("لم يتم العثور على الإشعار", 404);
    }

    return res.status(200).json({
      message: "تم تحديد الإشعار كمقروء",
      notification,
    });
  } catch (error) {
    next(error);
  }
};

// تحديد كل الإشعارات كمقروءة
const markAllAdminNotificationsAsRead = async (req, res, next) => {
  try {
    await adminNotificationModel.updateMany(
      {
        isRead: false,
      },
      {
        isRead: true,
      },
    );

    return res.status(200).json({
      message: "تم تحديد جميع الإشعارات كمقروءة",
    });
  } catch (error) {
    next(error);
  }
};

export {
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
};
