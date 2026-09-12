import caseModel from "../models/case.model.js";
import ClientModel from "../models/clients.model.js";
import notesModel from "../models/notes.model.js";
import officeModel from "../models/office.model.js";
import sessionModel from "../models/session.model.js";
import UserModel from "../models/User.model.js";

import createTimeLine from "../services/timeline.service.js";
import AppError from "../utils/AppError.js";

// ==========================================
// Get Office ID
// ==========================================

const getOfficeId = async (req) => {
  // ==========================================
  // Office Owner
  // ==========================================

  if (req.user.role === "office_owner") {
    const office = await officeModel.findOne({
      Owner_id: req.user.id,
    });

    if (!office) {
      return null;
    }

    return office._id;
  }

  // ==========================================
  // Lawyer
  // ==========================================

  if (req.user.role === "lawyer") {
    const user = await UserModel.findById(req.user.id);

    if (!user || !user.officeId) {
      return null;
    }

    return user.officeId;
  }

  return null;
};

// ==========================================
// Add Note
// ==========================================

const addNote = async (req, res, next) => {
  try {
    // ==========================================
    // Get Office
    // ==========================================

    const officeId = await getOfficeId(req);

    if (!officeId) {
      throw new AppError("غير مصرح لك بإضافة ملاحظة", 403);
    }

    // ==========================================
    // Get Body
    // ==========================================

    const { caseId, clientId, sessionId, content } = req.body;

    // ==========================================
    // Validate Content
    // ==========================================

    if (!content || !content.trim()) {
      throw new AppError("محتوى الملاحظة مطلوب", 400);
    }

    // ==========================================
    // Check Case
    // ==========================================

    let caseData = null;

    if (caseId) {
      caseData = await caseModel.findOne({
        _id: caseId,
        officeId,
      });

      if (!caseData) {
        throw new AppError("القضية غير موجودة داخل المكتب", 404);
      }
    }

    // ==========================================
    // Check Client
    // ==========================================

    let clientData = null;

    if (clientId) {
      clientData = await ClientModel.findOne({
        _id: clientId,
        officeId,
      });

      if (!clientData) {
        throw new AppError("العميل غير موجود داخل المكتب", 404);
      }
    }

    // ==========================================
    // Check Session
    // ==========================================

    let sessionData = null;

    if (sessionId) {
      sessionData = await sessionModel.findOne({
        _id: sessionId,
        officeId,
      });

      if (!sessionData) {
        throw new AppError("الجلسة غير موجودة داخل المكتب", 404);
      }
    }

    // ==========================================
    // Check Case + Client Relationship
    // ==========================================

    if (caseData && clientData) {
      if (caseData.clientId.toString() !== clientData._id.toString()) {
        throw new AppError("العميل لا يتبع القضية المحددة", 400);
      }
    }

    // ==========================================
    // Check Session + Case Relationship
    // ==========================================

    if (sessionData && caseData) {
      if (sessionData.caseId.toString() !== caseData._id.toString()) {
        throw new AppError("الجلسة لا تتبع القضية المحددة", 400);
      }
    }

    // ==========================================
    // Create Note
    // ==========================================

    const note = await notesModel.create({
      officeId,
      caseId: caseId || null,
      clientId: clientId || null,
      sessionId: sessionId || null,
      content: content.trim(),
      createdBy: req.user.id,
    });

    // ==========================================
    // Timeline
    // ==========================================

    await createTimeLine({
      officeId,
      caseId: note.caseId,
      clientId: note.clientId,
      sessionId: note.sessionId,
      noteId: note._id,
      type: "note_created",
      title: "تم إضافة ملاحظة جديدة",
      description: `تم إضافة ملاحظة جديدة${
        caseData ? ` للقضية رقم ${caseData.caseNumber}` : ""
      }`,
      createdBy: req.user.id,
    });

    // ==========================================
    // Response
    // ==========================================

    return res.status(201).json({
      message: "تم إضافة الملاحظة بنجاح",
      note,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Notes
// ==========================================

const getNotes = async (req, res, next) => {
  try {
    // ==========================================
    // Get Office
    // ==========================================

    const officeId = await getOfficeId(req);

    if (!officeId) {
      throw new AppError("غير مصرح لك بعرض الملاحظات", 403);
    }

    // ==========================================
    // Filters
    // ==========================================

    const { caseId, clientId, sessionId } = req.query;

    const filter = {
      officeId,
    };

    if (caseId) {
      filter.caseId = caseId;
    }

    if (clientId) {
      filter.clientId = clientId;
    }

    if (sessionId) {
      filter.sessionId = sessionId;
    }

    // ==========================================
    // Get Notes
    // ==========================================

    const notes = await notesModel
      .find(filter)
      .populate("caseId", "caseNumber title")
      .populate("clientId", "name phone")
      .populate("sessionId", "title sessionDate sessionTime")
      .populate("createdBy", "name email")
      .sort({
        createdAt: -1,
      });

    // ==========================================
    // Response
    // ==========================================

    return res.status(200).json({
      message: "تم استرجاع الملاحظات بنجاح",
      count: notes.length,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Note By ID
// ==========================================

const getNotesById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ==========================================
    // Get Office
    // ==========================================

    const officeId = await getOfficeId(req);

    if (!officeId) {
      throw new AppError("غير مصرح لك بعرض الملاحظات", 403);
    }

    // ==========================================
    // Get Note
    // ==========================================

    const note = await notesModel
      .findOne({
        _id: id,
        officeId,
      })
      .populate("caseId", "caseNumber title")
      .populate("clientId", "name phone")
      .populate("sessionId", "title sessionDate sessionTime")
      .populate("createdBy", "name email");

    if (!note) {
      throw new AppError("لم يتم العثور على الملاحظة", 404);
    }

    // ==========================================
    // Response
    // ==========================================

    return res.status(200).json({
      message: "تم استرجاع الملاحظة بنجاح",
      note,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Update Note
// ==========================================

const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ==========================================
    // Get Office
    // ==========================================

    const officeId = await getOfficeId(req);

    if (!officeId) {
      throw new AppError("غير مصرح لك بتعديل الملاحظات", 403);
    }

    // ==========================================
    // Find Note
    // ==========================================

    const note = await notesModel.findOne({
      _id: id,
      officeId,
    });

    if (!note) {
      throw new AppError("لم يتم العثور على الملاحظة", 404);
    }

    // ==========================================
    // Validate Content
    // ==========================================

    const { content } = req.body;

    if (!content || !content.trim()) {
      throw new AppError("محتوى الملاحظة مطلوب", 400);
    }

    // ==========================================
    // Update
    // ==========================================

    note.content = content.trim();

    await note.save();

    // ==========================================
    // Timeline
    // ==========================================

    await createTimeLine({
      officeId,
      caseId: note.caseId,
      clientId: note.clientId,
      sessionId: note.sessionId,
      noteId: note._id,
      type: "note_updated",
      title: "تم تعديل الملاحظة",
      description: "تم تعديل محتوى الملاحظة",
      createdBy: req.user.id,
    });

    // ==========================================
    // Response
    // ==========================================

    return res.status(200).json({
      message: "تم تحديث الملاحظة بنجاح",
      note,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Delete Note
// ==========================================

const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ==========================================
    // Get Office
    // ==========================================

    const officeId = await getOfficeId(req);

    if (!officeId) {
      throw new AppError("غير مصرح لك بحذف الملاحظات", 403);
    }

    // ==========================================
    // Delete Note
    // ==========================================

    const note = await notesModel.findOneAndDelete({
      _id: id,
      officeId,
    });

    if (!note) {
      throw new AppError("لم يتم العثور على الملاحظة", 404);
    }

    // ==========================================
    // Timeline
    // ==========================================

    await createTimeLine({
      officeId,
      caseId: note.caseId,
      clientId: note.clientId,
      sessionId: note.sessionId,
      noteId: note._id,
      type: "note_deleted",
      title: "تم حذف الملاحظة",
      description: "تم حذف الملاحظة",
      createdBy: req.user.id,
    });

    // ==========================================
    // Response
    // ==========================================

    return res.status(200).json({
      message: "تم حذف الملاحظة بنجاح",
      note,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Export
// ==========================================

export { addNote, getNotes, getNotesById, updateNote, deleteNote };
