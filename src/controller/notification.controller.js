
import notificationModel from "../models/notification.model.js";
import AppError from "../utils/AppError.js";

// جلب إشعارات المستخدم الحالي
const getNotifications = async (req, res, next) => {
  try {
    console.log("========== GET NOTIFICATIONS ==========");
    console.log("REQ.USER:", req.user);
    console.log("USER ID:", req.user.id);

    const notifications = await notificationModel
      .find({
        userId: req.user.id,
      })
      .populate("caseId", "caseNumber title")
      .populate("sessionId", "sessionDate sessionTime")
      .sort({ createdAt: -1 });

    console.log("NOTIFICATIONS FOUND:", notifications.length);
    console.log("NOTIFICATIONS:", notifications);

    return res.status(200).json({
      message: "تم جلب الإشعارات بنجاح",
      notifications,
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    next(error);
  }
};
// عدد الإشعارات غير المقروءة
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationModel.countDocuments({
      userId: req.user.id,
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
const markAsRead = async (req, res, next) => {
  const { id } = req.params;

  try {
    const notification = await notificationModel.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.id,
      },
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
const markAllAsRead = async (req, res, next) => {
  try {
    await notificationModel.updateMany(
      {
        userId: req.user.id,
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

// حذف إشعار
const deleteNotification = async (req, res, next) => {
  const { id } = req.params;

  try {
    const notification = await notificationModel.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!notification) {
      throw new AppError("لم يتم العثور على الإشعار", 404);
    }

    return res.status(200).json({
      message: "تم حذف الإشعار بنجاح",
    });
  } catch (error) {
    next(error);
  }
};

export {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

