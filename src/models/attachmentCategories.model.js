import mongoose from "mongoose";

const attachmentCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    ownerType: {
      type: String,
      enum: ["office", "lawyer"],
      required: true,
    },

    officeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
      default: null,
    },

    lawyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// منع تكرار الاسم داخل نفس المكتب
// بشرط أن التصنيف Active
attachmentCategorySchema.index(
  { officeId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      ownerType: "office",
      isActive: true,
    },
  },
);

// منع تكرار الاسم عند نفس المحامي المستقل
// بشرط أن التصنيف Active
attachmentCategorySchema.index(
  { lawyerId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      ownerType: "lawyer",
      isActive: true,
    },
  },
);

const AttachmentCategoryModel =
  mongoose.models.AttachmentCategory ||
  mongoose.model("AttachmentCategory", attachmentCategorySchema);

export default AttachmentCategoryModel;
