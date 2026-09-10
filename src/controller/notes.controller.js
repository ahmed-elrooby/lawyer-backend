import caseModel from "../models/case.model.js";
import ClientModel from "../models/clients.model.js";
import notesModel from "../models/notes.model.js";
import officeModel from "../models/office.model.js";
import sessionModel from "../models/session.model.js";
import UserModel from "../models/User.model.js";
import createTimeLine from "../services/timeline.service.js";

const addNote = async (req, res) => {
  try {
    let officeId;

    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
      }

      officeId = office._id;
    }

    if (req.user.role === "lawyer") {
      const lawyer = await UserModel.findById(req.user.id);

      if (!lawyer || !lawyer.officeId) {
        return res.status(404).json({
          message: "لم يتم العثور على مكتب المحامي",
        });
      }

      officeId = lawyer.officeId;
    }

    if (!officeId) {
      return res.status(403).json({
        message: "غير مصرح لك بإضافة ملاحظة",
      });
    }

    const { caseId, clientId, sessionId, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        message: "محتوى الملاحظة مطلوب",
      });
    }

    let caseData = null;

    if (caseId) {
      caseData = await caseModel.findOne({
        _id: caseId,
        officeId,
      });

      if (!caseData) {
        return res.status(404).json({
          message: "القضية غير موجودة داخل المكتب",
        });
      }
    }

    let clientData = null;

    if (clientId) {
      clientData = await ClientModel.findOne({
        _id: clientId,
        officeId,
      });

      if (!clientData) {
        return res.status(404).json({
          message: "العميل غير موجود داخل المكتب",
        });
      }
    }

    let sessionData = null;

    if (sessionId) {
      sessionData = await sessionModel.findOne({
        _id: sessionId,
        officeId,
      });

      if (!sessionData) {
        return res.status(404).json({
          message: "الجلسة غير موجودة داخل المكتب",
        });
      }
    }

    if (caseData && clientData) {
      if (caseData.clientId.toString() !== clientData._id.toString()) {
        return res.status(400).json({
          message: "العميل لا يتبع القضية المحددة",
        });
      }
    }

    if (sessionData && caseData) {
      if (sessionData.caseId.toString() !== caseData._id.toString()) {
        return res.status(400).json({
          message: "الجلسة لا تتبع القضية المحددة",
        });
      }
    }

    const note = await notesModel.create({
      officeId,
      caseId: caseId || null,
      clientId: clientId || null,
      sessionId: sessionId || null,
      content: content.trim(),
      createdBy: req.user.id,
    });

    // إضافة Timeline Event
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

    return res.status(201).json({
      message: "تم إضافة الملاحظة بنجاح",
      note,
    });
  } catch (error) {
    console.error("Add Note Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "يوجد ID غير صالح",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "بيانات الملاحظة غير صحيحة",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};
const getNotes = async (req, res) => {
  try {
    let officeId;

    // صاحب المكتب
    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
      }

      officeId = office._id;
    }

    // المحامي
    if (req.user.role === "lawyer") {
      const user = await UserModel.findById(req.user.id);

      if (!user || !user.officeId) {
        return res.status(404).json({
          message: "لم يتم العثور على مكتب المحامي",
        });
      }

      officeId = user.officeId;
    }

    if (!officeId) {
      return res.status(403).json({
        message: "غير مصرح لك بعرض الملاحظات",
      });
    }

    // الفلاتر الاختيارية
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

    const notes = await notesModel
      .find(filter)
      .populate("caseId", "caseNumber title")
      .populate("clientId", "name phone")
      .populate("sessionId", "title sessionDate sessionTime")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "تم استرجاع الملاحظات بنجاح",
      count: notes.length,
      notes,
    });
  } catch (error) {
    console.error("Get Notes Error:", error);

    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};
const getNotesById = async (req, res) => {
  try {
    const { id } = req.params;

    let officeId;

    // صاحب المكتب
    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
      }

      officeId = office._id;
    }

    // المحامي
    if (req.user.role === "lawyer") {
      const user = await UserModel.findById(req.user.id);

      if (!user || !user.officeId) {
        return res.status(404).json({
          message: "لم يتم العثور على مكتب المحامي",
        });
      }

      officeId = user.officeId;
    }

    if (!officeId) {
      return res.status(403).json({
        message: "غير مصرح لك بعرض الملاحظات",
      });
    }

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
      return res.status(404).json({
        message: "لم يتم العثور على الملاحظة",
      });
    }

    return res.status(200).json({
      message: "تم استرجاع الملاحظة بنجاح",
      note,
    });
  } catch (error) {
    console.error("Get Note Error:", error);

    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;

    let officeId;

    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
      }

      officeId = office._id;
    }

    if (req.user.role === "lawyer") {
      const user = await UserModel.findById(req.user.id);

      if (!user || !user.officeId) {
        return res.status(404).json({
          message: "لم يتم العثور على مكتب المحامي",
        });
      }

      officeId = user.officeId;
    }

    if (!officeId) {
      return res.status(403).json({
        message: "غير مصرح لك بتعديل الملاحظات",
      });
    }

    const note = await notesModel.findOne({
      _id: id,
      officeId,
    });

    if (!note) {
      return res.status(404).json({
        message: "لم يتم العثور على الملاحظة",
      });
    }

    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        message: "محتوى الملاحظة مطلوب",
      });
    }

    note.content = content.trim();

    await note.save();

    // إضافة Timeline Event
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

    return res.status(200).json({
      message: "تم تحديث الملاحظة بنجاح",
      note,
    });
  } catch (error) {
    console.error("Update Note Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "يوجد ID غير صالح",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "بيانات الملاحظة غير صحيحة",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    let officeId;

    // صاحب المكتب
    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
      }

      officeId = office._id;
    }

    // المحامي
    if (req.user.role === "lawyer") {
      const user = await UserModel.findById(req.user.id);

      if (!user || !user.officeId) {
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
      }

      officeId = user.officeId;
    }

    if (!officeId) {
      return res.status(403).json({
        message: "غير مصرح لك بحذف الملاحظات",
      });
    }

    const note = await notesModel.findOneAndDelete({
      _id: id,
      officeId,
    });

    if (!note) {
      return res.status(404).json({
        message: "لم يتم العثور على الملاحظة",
      });
    }

    // إضافة Timeline Event
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

    return res.status(200).json({
      message: "تم حذف الملاحظة بنجاح",
      note,
    });
  } catch (error) {
    console.error("Delete Note Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "يوجد ID غير صالح",
      });
    }

    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};
export { addNote, getNotes, getNotesById, updateNote, deleteNote };
