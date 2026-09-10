import notificationModel from "../models/notification.model.js";

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

export default createNotification;