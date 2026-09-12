import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "new_office",
        "new_office_owner",
        "new_lawyer",
        "subscription_created",
        "subscription_expired",
        "system",
      ],
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

    officeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
      default: null,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

adminNotificationSchema.index({
  isRead: 1,
  createdAt: -1,
});

const adminNotificationModel = mongoose.model(
  "AdminNotification",
  adminNotificationSchema,
);

export default adminNotificationModel;
