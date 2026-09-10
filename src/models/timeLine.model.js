import mongoose from "mongoose";

const timeLineSchema = new mongoose.Schema(
  {
    officeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
      required: true,
    },

    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      default: null,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },

    attachmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attachment",
      default: null,
    },

    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      default: null,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "case_created",
        "case_updated",

        "session_created",
        "session_updated",

        "attachment_uploaded",
        "attachment_deleted",

        "note_created",
        "note_updated",
        "note_deleted",
      ],
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
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

timeLineSchema.index({
  officeId: 1,
  caseId: 1,
  createdAt: -1,
});

const timeLineModel = mongoose.model("TimeLine", timeLineSchema);

export default timeLineModel;
 