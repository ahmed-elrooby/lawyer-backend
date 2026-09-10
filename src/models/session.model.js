import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    officeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
      required: true,
    },

    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    sessionDate: {
      type: Date,
      required: true,
    },

    sessionTime: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["scheduled", "attended", "postponed", "completed", "cancelled"],
      default: "scheduled",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    decision: {
      type: String,
      trim: true,
      default: "",
    },

    nextSessionDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

sessionSchema.index(
  {
    officeId: 1,
    caseId: 1,
    sessionDate: 1,
    sessionTime: 1,
  },
  {
    unique: true,
  },
);

export default mongoose.model("Session", sessionSchema);
