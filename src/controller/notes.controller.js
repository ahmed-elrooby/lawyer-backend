import caseModel from "../models/case.model.js";
import ClientModel from "../models/clients.model.js";
import notesModel from "../models/notes.model.js";
import officeModel from "../models/office.model.js";
import sessionModel from "../models/session.model.js";
import UserModel from "../models/User.model.js";

import createTimeLine from "../services/timeline.service.js";
import AppError from "../utils/AppError.js";

// ==========================================
// Get User Scope
// ==========================================

const getUserScope = async (req) => {
  const user = await UserModel.findById(req.user.id);

  if (!user) {
    throw new AppError("المستخدم غير موجود", 404);
  }

  // ==========================================
  // Office Owner
  // ==========================================

  if (user.role === "office_owner") {
    const office = await officeModel.findOne({
      Owner_id: user._id,
    });

    if (!office) {
      throw new AppError("لا يوجد مكتب مرتبط بحسابك", 403);
    }

    return {
      user,
      officeId: office._id,
      isIndependent: false,
      isOfficeOwner: true,
    };
  }

  // ==========================================
  // Lawyer
  // ==========================================

  if (user.role === "lawyer") {
    // Lawyer belongs to an office
    if (user.officeId) {
      return {
        user,
        officeId: user.officeId,
        isIndependent: false,
        isOfficeOwner: false,
      };
    }

    // Independent Lawyer
    return {
      user,
      officeId: null,
      isIndependent: true,
      isOfficeOwner: false,
    };
  }

  throw new AppError("غير مسموح لك بتنفيذ هذا الإجراء", 403);
};

// ==========================================
// Get Case By Scope
// ==========================================

const getCaseByScope = async ({
  caseId,
  user,
  officeId,
  isIndependent,
  isOfficeOwner,
}) => {
  if (!caseId) {
    return null;
  }

  // ==========================================
  // Office Owner
  // ==========================================

  if (isOfficeOwner) {
    return await caseModel.findOne({
      _id: caseId,
      officeId,
    });
  }

  // ==========================================
  // Lawyer
  // ==========================================

  if (user.role === "lawyer") {
    // ==========================================
    // Independent Lawyer
    // ==========================================

    if (isIndependent) {
      return await caseModel.findOne({
        _id: caseId,
        officeId: null,
        lawyers: user._id,
      });
    }

    // ==========================================
    // Lawyer Inside Office
    // ==========================================

    return await caseModel.findOne({
      _id: caseId,
      officeId,
      lawyers: user._id,
    });
  }

  return null;
};

// ==========================================
// Get Client By Scope
// ==========================================

const getClientByScope = async ({
  clientId,
  user,
  officeId,
  isIndependent,
  isOfficeOwner,
}) => {
  if (!clientId) {
    return null;
  }

  // ==========================================
  // Office Owner
  // ==========================================

  if (isOfficeOwner) {
    return await ClientModel.findOne({
      _id: clientId,
      officeId,
    });
  }

  // ==========================================
  // Lawyer
  // ==========================================

  if (user.role === "lawyer") {
    // ==========================================
    // Independent Lawyer
    // ==========================================

    if (isIndependent) {
      return await ClientModel.findOne({
        _id: clientId,
        officeId: null,
        createdBy: user._id,
      });
    }

    // ==========================================
    // Lawyer Inside Office
    // ==========================================

    return await ClientModel.findOne({
      _id: clientId,
      officeId,
    });
  }

  return null;
};

// ==========================================
// Get Session By Scope
// ==========================================

const getSessionByScope = async ({
  sessionId,
  user,
  officeId,
  isIndependent,
  isOfficeOwner,
}) => {
  if (!sessionId) {
    return null;
  }

  // ==========================================
  // Office Owner
  // ==========================================

  if (isOfficeOwner) {
    return await sessionModel.findOne({
      _id: sessionId,
      officeId,
    });
  }

  // ==========================================
  // Lawyer
  // ==========================================

  if (user.role === "lawyer") {
    // ==========================================
    // Independent Lawyer
    // ==========================================

    if (isIndependent) {
      const session = await sessionModel.findOne({
        _id: sessionId,
        officeId: null,
      });

      if (!session) {
        return null;
      }

      const caseData = await caseModel.findOne({
        _id: session.caseId,
        officeId: null,
        lawyers: user._id,
      });

      if (!caseData) {
        return null;
      }

      return session;
    }

    // ==========================================
    // Lawyer Inside Office
    // ==========================================

    const session = await sessionModel.findOne({
      _id: sessionId,
      officeId,
    });

    if (!session) {
      return null;
    }

    // Make sure lawyer is assigned to the session's case
    const caseData = await caseModel.findOne({
      _id: session.caseId,
      officeId,
      lawyers: user._id,
    });

    if (!caseData) {
      return null;
    }

    return session;
  }

  return null;
};

// ==========================================
// Add Note
// ==========================================

const addNote = async (req, res, next) => {
  try {
    // ==========================================
    // Get User Scope
    // ==========================================

    const {
      user,
      officeId,
      isIndependent,
      isOfficeOwner,
    } = await getUserScope(req);

    // ==========================================
    // Get Body
    // ==========================================

    const {
      caseId,
      clientId,
      sessionId,
      content,
    } = req.body;

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
      caseData = await getCaseByScope({
        caseId,
        user,
        officeId,
        isIndependent,
        isOfficeOwner,
      });

      if (!caseData) {
        throw new AppError(
          "القضية غير موجودة أو غير مسموح لك بالوصول إليها",
          404,
        );
      }
    }

    // ==========================================
    // Check Client
    // ==========================================

    let clientData = null;

    if (clientId) {
      clientData = await getClientByScope({
        clientId,
        user,
        officeId,
        isIndependent,
        isOfficeOwner,
      });

      if (!clientData) {
        throw new AppError(
          "العميل غير موجود أو غير مسموح لك بالوصول إليه",
          404,
        );
      }
    }

    // ==========================================
    // Check Session
    // ==========================================

    let sessionData = null;

    if (sessionId) {
      sessionData = await getSessionByScope({
        sessionId,
        user,
        officeId,
        isIndependent,
        isOfficeOwner,
      });

      if (!sessionData) {
        throw new AppError(
          "الجلسة غير موجودة أو غير مسموح لك بالوصول إليها",
          404,
        );
      }
    }

    // ==========================================
    // Check Case + Client Relationship
    // ==========================================

    if (caseData && clientData) {
      if (
        !caseData.clientId ||
        caseData.clientId.toString() !==
          clientData._id.toString()
      ) {
        throw new AppError(
          "العميل لا يتبع القضية المحددة",
          400,
        );
      }
    }

    // ==========================================
    // Check Session + Case Relationship
    // ==========================================

    if (sessionData && caseData) {
      if (
        sessionData.caseId.toString() !==
        caseData._id.toString()
      ) {
        throw new AppError(
          "الجلسة لا تتبع القضية المحددة",
          400,
        );
      }
    }

    // ==========================================
    // If Session Exists
    // Make Sure It Has A Case
    // ==========================================

    if (sessionData && !caseData) {
      caseData = await getCaseByScope({
        caseId: sessionData.caseId,
        user,
        officeId,
        isIndependent,
        isOfficeOwner,
      });

      if (!caseData) {
        throw new AppError(
          "القضية المرتبطة بالجلسة غير متاحة لك",
          404,
        );
      }
    }

    // ==========================================
    // Create Note
    // ==========================================

    const note = await notesModel.create({
      officeId: officeId || null,
      caseId: caseId || null,
      clientId: clientId || null,
      sessionId: sessionId || null,
      content: content.trim(),
      createdBy: user._id,
    });

    // ==========================================
    // Timeline
    // ==========================================

    await createTimeLine({
      officeId: officeId || null,
      caseId: note.caseId,
      clientId: note.clientId,
      sessionId: note.sessionId,
      noteId: note._id,
      type: "note_created",
      title: "تم إضافة ملاحظة جديدة",
      description: `تم إضافة ملاحظة جديدة${
        caseData
          ? ` للقضية رقم ${caseData.caseNumber}`
          : ""
      }`,
      createdBy: user._id,
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
    const {
      user,
      officeId,
      isIndependent,
      isOfficeOwner,
    } = await getUserScope(req);

    const {
      caseId,
      clientId,
      sessionId,
    } = req.query;

    // ==========================================
    // Office Owner
    // ==========================================

    if (isOfficeOwner) {
      const filter = {
        officeId,
      };

      if (caseId) filter.caseId = caseId;
      if (clientId) filter.clientId = clientId;
      if (sessionId) filter.sessionId = sessionId;

      const notes = await notesModel
        .find(filter)
        .populate("caseId", "caseNumber title")
        .populate("clientId", "name phone")
        .populate(
          "sessionId",
          "title sessionDate sessionTime",
        )
        .populate("createdBy", "name email")
        .sort({
          createdAt: -1,
        });

      return res.status(200).json({
        message: "تم استرجاع الملاحظات بنجاح",
        count: notes.length,
        notes,
      });
    }

    // ==========================================
    // Independent Lawyer
    // ==========================================

    if (isIndependent) {
      const filter = {
        officeId: null,
        createdBy: user._id,
      };

      if (caseId) {
        const caseData = await getCaseByScope({
          caseId,
          user,
          officeId,
          isIndependent,
          isOfficeOwner,
        });

        if (!caseData) {
          throw new AppError(
            "القضية غير موجودة أو غير مسموح لك بالوصول إليها",
            404,
          );
        }

        filter.caseId = caseId;
      }

      if (clientId) {
        const clientData = await getClientByScope({
          clientId,
          user,
          officeId,
          isIndependent,
          isOfficeOwner,
        });

        if (!clientData) {
          throw new AppError(
            "العميل غير موجود أو غير مسموح لك بالوصول إليه",
            404,
          );
        }

        filter.clientId = clientId;
      }

      if (sessionId) {
        const sessionData = await getSessionByScope({
          sessionId,
          user,
          officeId,
          isIndependent,
          isOfficeOwner,
        });

        if (!sessionData) {
          throw new AppError(
            "الجلسة غير موجودة أو غير مسموح لك بالوصول إليها",
            404,
          );
        }

        filter.sessionId = sessionId;
      }

      const notes = await notesModel
        .find(filter)
        .populate("caseId", "caseNumber title")
        .populate("clientId", "name phone")
        .populate(
          "sessionId",
          "title sessionDate sessionTime",
        )
        .populate("createdBy", "name email")
        .sort({
          createdAt: -1,
        });

      return res.status(200).json({
        message: "تم استرجاع الملاحظات بنجاح",
        count: notes.length,
        notes,
      });
    }

    // ==========================================
    // Lawyer Inside Office
    // ==========================================

    if (user.role === "lawyer") {
      const cases = await caseModel.find({
        officeId,
        lawyers: user._id,
      }).select("_id");

      const caseIds = cases.map((item) => item._id);

      const filter = {
        officeId,
        $or: [
          {
            caseId: {
              $in: caseIds,
            },
          },
          {
            createdBy: user._id,
          },
        ],
      };

      if (caseId) {
        if (
          !caseIds.some(
            (item) => item.toString() === caseId,
          )
        ) {
          throw new AppError(
            "غير مسموح لك بالوصول إلى هذه القضية",
            403,
          );
        }

        filter.caseId = caseId;
        delete filter.$or;
      }

      if (clientId) {
        filter.clientId = clientId;
      }

      if (sessionId) {
        const sessionData = await getSessionByScope({
          sessionId,
          user,
          officeId,
          isIndependent,
          isOfficeOwner,
        });

        if (!sessionData) {
          throw new AppError(
            "الجلسة غير موجودة أو غير مسموح لك بالوصول إليها",
            404,
          );
        }

        filter.sessionId = sessionId;
      }

      const notes = await notesModel
        .find(filter)
        .populate("caseId", "caseNumber title")
        .populate("clientId", "name phone")
        .populate(
          "sessionId",
          "title sessionDate sessionTime",
        )
        .populate("createdBy", "name email")
        .sort({
          createdAt: -1,
        });

      return res.status(200).json({
        message: "تم استرجاع الملاحظات بنجاح",
        count: notes.length,
        notes,
      });
    }

    throw new AppError(
      "غير مسموح لك بعرض الملاحظات",
      403,
    );
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

    const {
      user,
      officeId,
      isIndependent,
      isOfficeOwner,
    } = await getUserScope(req);

    let filter = {
      _id: id,
    };

    // ==========================================
    // Office Owner
    // ==========================================

    if (isOfficeOwner) {
      filter.officeId = officeId;
    }

    // ==========================================
    // Independent Lawyer
    // ==========================================

    else if (isIndependent) {
      filter.officeId = null;
      filter.createdBy = user._id;
    }

    // ==========================================
    // Office Lawyer
    // ==========================================

    else {
      const cases = await caseModel.find({
        officeId,
        lawyers: user._id,
      }).select("_id");

      const caseIds = cases.map((item) => item._id);

      filter.officeId = officeId;

      const note = await notesModel
        .findOne(filter)
        .populate("caseId", "caseNumber title")
        .populate("clientId", "name phone")
        .populate(
          "sessionId",
          "title sessionDate sessionTime",
        )
        .populate("createdBy", "name email");

      if (!note) {
        throw new AppError(
          "لم يتم العثور على الملاحظة",
          404,
        );
      }

      const hasAccess =
        note.createdBy?._id?.toString() ===
          user._id.toString() ||
        (note.caseId?._id &&
          caseIds.some(
            (item) =>
              item.toString() ===
              note.caseId._id.toString(),
          ));

      if (!hasAccess) {
        throw new AppError(
          "غير مسموح لك بالوصول إلى هذه الملاحظة",
          403,
        );
      }

      return res.status(200).json({
        message: "تم استرجاع الملاحظة بنجاح",
        note,
      });
    }

    const note = await notesModel
      .findOne(filter)
      .populate("caseId", "caseNumber title")
      .populate("clientId", "name phone")
      .populate(
        "sessionId",
        "title sessionDate sessionTime",
      )
      .populate("createdBy", "name email");

    if (!note) {
      throw new AppError(
        "لم يتم العثور على الملاحظة",
        404,
      );
    }

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
    const { content } = req.body;

    if (!content || !content.trim()) {
      throw new AppError(
        "محتوى الملاحظة مطلوب",
        400,
      );
    }

    const {
      user,
      officeId,
      isIndependent,
      isOfficeOwner,
    } = await getUserScope(req);

    let note = null;

    // ==========================================
    // Office Owner
    // ==========================================

    if (isOfficeOwner) {
      note = await notesModel.findOne({
        _id: id,
        officeId,
      });
    }

    // ==========================================
    // Independent Lawyer
    // ==========================================

    else if (isIndependent) {
      note = await notesModel.findOne({
        _id: id,
        officeId: null,
        createdBy: user._id,
      });
    }

    // ==========================================
    // Office Lawyer
    // ==========================================

    else {
      note = await notesModel.findOne({
        _id: id,
        officeId,
        createdBy: user._id,
      });
    }

    if (!note) {
      throw new AppError(
        "لم يتم العثور على الملاحظة أو ليس لديك صلاحية تعديلها",
        404,
      );
    }

    note.content = content.trim();

    await note.save();

    await createTimeLine({
      officeId: officeId || null,
      caseId: note.caseId,
      clientId: note.clientId,
      sessionId: note.sessionId,
      noteId: note._id,
      type: "note_updated",
      title: "تم تعديل الملاحظة",
      description: "تم تعديل محتوى الملاحظة",
      createdBy: user._id,
    });

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

    const {
      user,
      officeId,
      isIndependent,
      isOfficeOwner,
    } = await getUserScope(req);

    let note = null;

    // ==========================================
    // Office Owner
    // ==========================================

    if (isOfficeOwner) {
      note = await notesModel.findOneAndDelete({
        _id: id,
        officeId,
      });
    }

    // ==========================================
    // Independent Lawyer
    // ==========================================

    else if (isIndependent) {
      note = await notesModel.findOneAndDelete({
        _id: id,
        officeId: null,
        createdBy: user._id,
      });
    }

    // ==========================================
    // Office Lawyer
    // ==========================================

    else {
      note = await notesModel.findOneAndDelete({
        _id: id,
        officeId,
        createdBy: user._id,
      });
    }

    if (!note) {
      throw new AppError(
        "لم يتم العثور على الملاحظة أو ليس لديك صلاحية حذفها",
        404,
      );
    }

    await createTimeLine({
      officeId: officeId || null,
      caseId: note.caseId,
      clientId: note.clientId,
      sessionId: note.sessionId,
      noteId: note._id,
      type: "note_deleted",
      title: "تم حذف الملاحظة",
      description: "تم حذف الملاحظة",
      createdBy: user._id,
    });

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

export {
  addNote,
  getNotes,
  getNotesById,
  updateNote,
  deleteNote,
};