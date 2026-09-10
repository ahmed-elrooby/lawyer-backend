import mongoose from "mongoose";

const caseTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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
  },
  { timestamps: true },
);

const CaseTypeModel = mongoose.model("CaseType", caseTypeSchema);

export default CaseTypeModel;
