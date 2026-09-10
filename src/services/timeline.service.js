import timeLineModel from "../models/timeLine.model.js";

const createTimeLine = async ({
  officeId,
  caseId,
  clientId,
  sessionId,
  attachmentId,
  noteId,
  type,
  title,
  description,
  createdBy,
}) => {
  const timeLine = await timeLineModel.create({
    officeId,
    caseId: caseId || null,
    clientId: clientId || null,
    sessionId: sessionId || null,
    attachmentId: attachmentId || null,
    noteId: noteId || null,
    type,
    title,
    description: description || "",
    createdBy,
  });

  return timeLine;
};

export default createTimeLine;
