
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
  const admins = await UserModel.find({
    role: "admin",
    isActive: true,
  }).select("_id");

  if (!admins.length) {
    return;
  }

  await notificationModel.insertMany(
    admins.map((admin) => ({
      officeId,
      userId: admin._id,
      type,
      title,
      message,
    })),
  );
};

export { notifyAdmins };

export default createNotification;

