import mongoose from "mongoose";

const caseSchema = new mongoose.Schema(
  {
    officeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
      default: null,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    lawyers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    caseTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CaseType",
      required: true,
    },

    caseNumber: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    court: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "reserved_for_judgment", "judged"],
      default: "active",
    },

    filingDate: {
      type: Date,
      required: true,
    },

    nextHearingDate: {
      type: Date,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// الرقم يكون unique داخل المكتب فقط
caseSchema.index(
  { officeId: 1, caseNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      officeId: { $type: "objectId" },
    },
  },
);

const caseModel = mongoose.model("Case", caseSchema);

export default caseModel;