import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    officeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "upcoming_session",
      ],
    },

    // نوع التذكير
    reminderType: {
      type: String,
      enum: ["1_day_before", "1_hour_before"],
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      default: null,
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
  );

notificationSchema.index({
  officeId: 1,
  userId: 1,
  createdAt: -1,
});

notificationSchema.index({
  userId: 1,
  isRead: 1,
});

// منع تكرار نفس التذكير لنفس المستخدم
notificationSchema.index(
  {
    sessionId: 1,
    userId: 1,
    reminderType: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      sessionId: { $exists: true, $ne: null },
      reminderType: { $exists: true, $ne: null },
    },
  },
);

const notificationModel = mongoose.model(
  "Notification",
  notificationSchema,
);

export default notificationModel;