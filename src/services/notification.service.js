
import notificationModel from "../models/notification.model.js";
import UserModel from "../models/User.model.js";

const createNotification = async ({
  officeId,
  userId,
  type,
  reminderType,
  title,
  message,
  caseId,
  sessionId,
}) => {
  const notification = await notificationModel.create({
    officeId,
    userId,
    type,
    reminderType: reminderType || null,
    title,
    message,
    caseId: caseId || null,
    sessionId: sessionId || null,
  });

  return notification;
};

const notifyAdmins = async ({
  officeId = null,
  type,
  title,
  message,
}) => {
  console.log("========== notifyAdmins START ==========");

  const admins = await UserModel.find({
    role: "admin",
    isActive: true,
  }).select("_id");

  console.log("Admins found:", admins.length);
  console.log("Admin IDs:", admins.map((admin) => admin._id));

  if (!admins.length) {
    console.log("No active admins found");
    return;
  }

  const notifications = await notificationModel.insertMany(
    admins.map((admin) => ({
      officeId,
      userId: admin._id,
      type,
      title,
      message,
    })),
  );

  console.log("Notifications created:", notifications.length);
  console.log("========== notifyAdmins END ==========");
};

export { notifyAdmins };

export default createNotification;

