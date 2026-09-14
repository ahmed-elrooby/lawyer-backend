import mongoose from "mongoose";

const caseTypeSchema = new mongoose.Schema(
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
  { timestamps: true },
);

// منع تكرار اسم نوع القضية داخل نفس المكتب
caseTypeSchema.index(
  { officeId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      ownerType: "office",
    },
  },
);

// منع تكرار اسم نوع القضية عند نفس المحامي المستقل
caseTypeSchema.index(
  { lawyerId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      ownerType: "lawyer",
    },
  },
);

const CaseTypeModel = mongoose.model("CaseType", caseTypeSchema);

export default CaseTypeModel;
