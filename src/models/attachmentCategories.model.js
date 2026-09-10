import mongoose from "mongoose";

const attachmentCategorySchema = new mongoose.Schema(
  {
    // اسم التصنيف
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // وصف التصنيف
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // هل التصنيف متاح للاستخدام؟
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const AttachmentCategoryModel = mongoose.model(
  "AttachmentCategory",
  attachmentCategorySchema,
);

export default AttachmentCategoryModel;
