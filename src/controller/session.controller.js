import caseModel from "../models/case.model.js";
import officeModel from "../models/office.model.js";
import sessionModel from "../models/session.model.js";
import UserModel from "../models/User.model.js";
import createTimeLine from "../services/timeline.service.js";
import AppError from "../utils/AppError.js";

// ==========================================
// Get Office ID
// ==========================================

const getOfficeId = async (req) => {
  // صاحب المكتب
  if (req.user.role === "office_owner") {
    const office = await officeModel.findOne({
      Owner_id: req.user.id,
    });

    if (!office) {
      return null;
    }

    return office._id;
  }

  // المحامي
  if (req.user.role === "lawyer") {
    const lawyer = await UserModel.findById(req.user.id);

    if (!lawyer || !lawyer.officeId) {
      return null;
    }

    return lawyer.officeId;
  }

  return null;
};

// ==========================================
// Add Session
// ==========================================

const handleAddSession = async (req, res, next) => {
  try {
    const officeId = await getOfficeId(req);

    if (!officeId) {
      throw new AppError("غير مسموح لك بإضافة جلسة", 403);
    }

    const {
      caseId,
      title,
      sessionDate,
      sessionTime,
      status,
      notes,
      decision,
      nextSessionDate,
    } = req.body;

    // التأكد أن القضية تابعة لنفس المكتب
    const caseData = await caseModel.findOne({
      _id: caseId,
      officeId,
    });

    if (!caseData) {
      throw new AppError("لم يتم العثور على القضية", 404);
    }

    const newSession = new sessionModel({
      officeId,
      caseId,
      title,
      sessionDate,
      sessionTime,
      status,
      notes,
      decision,
      nextSessionDate,
    });

    await newSession.save();

    await createTimeLine({
      officeId,
      caseId: newSession.caseId,
      sessionId: newSession._id,
      type: "session_created",
      title: "تم إضافة جلسة جديدة",
      description: `تم إضافة جلسة جديدة للقضية رقم ${caseData.caseNumber}`,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      message: "تم إضافة الجلسة بنجاح",
      session: newSession,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Sessions
// ==========================================

const getSessions = async (req, res, next) => {
  try {
    const officeId = await getOfficeId(req);

    if (!officeId) {
      throw new AppError("غير مسموح لك بعرض الجلسات", 403);
    }

    const sessions = await sessionModel
      .find({
        officeId,
      })
      .populate("caseId", "caseNumber title")
      .populate("officeId", "name")
      .sort({
        sessionDate: 1,
      });

    return res.status(200).json({
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Delete Session
// ==========================================

const deleteSession = async (req, res, next) => {
  const { id } = req.params;

  try {
    const officeId = await getOfficeId(req);

    if (!officeId) {
      throw new AppError("غير مسموح لك بحذف الجلسات", 403);
    }

    const session = await sessionModel.findOneAndDelete({
      _id: id,
      officeId,
    });

    if (!session) {
      throw new AppError("لم يتم العثور على الجلسة", 404);
    }

    return res.status(200).json({
      message: "تم حذف الجلسة بنجاح",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Update Session
// ==========================================

const updateSession = async (req, res, next) => {
  const { id } = req.params;

  try {
    const officeId = await getOfficeId(req);

    if (!officeId) {
      throw new AppError("غير مسموح لك بتعديل الجلسات", 403);
    }

    const {
      caseId,
      title,
      sessionDate,
      sessionTime,
      status,
      notes,
      decision,
      nextSessionDate,
    } = req.body;

    const updateData = {};

    if (caseId !== undefined) {
      updateData.caseId = caseId;
    }

    if (title !== undefined) {
      updateData.title = title;
    }

    if (sessionDate !== undefined) {
      updateData.sessionDate = sessionDate;
    }

    if (sessionTime !== undefined) {
      updateData.sessionTime = sessionTime;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (decision !== undefined) {
      updateData.decision = decision;
    }

    if (nextSessionDate !== undefined) {
      updateData.nextSessionDate = nextSessionDate;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError("لم يتم إرسال أي بيانات للتعديل", 400);
    }

    // لو بيغير القضية
    // نتأكد أن القضية الجديدة تابعة لنفس المكتب
    if (caseId !== undefined) {
      const caseData = await caseModel.findOne({
        _id: caseId,
        officeId,
      });

      if (!caseData) {
        throw new AppError("القضية غير موجودة أو لا تتبع هذا المكتب", 404);
      }
    }

    const session = await sessionModel.findOneAndUpdate(
      {
        _id: id,
        officeId,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!session) {
      throw new AppError("لم يتم العثور على الجلسة", 404);
    }

    // جلب القضية المرتبطة بالجلسة بعد التعديل
    const caseData = await caseModel.findOne({
      _id: session.caseId,
      officeId,
    });

    // تسجيل الحدث في Timeline
    await createTimeLine({
      officeId,
      caseId: session.caseId,
      sessionId: session._id,
      type: "session_updated",
      title: "تم تعديل الجلسة",
      description: `تم تعديل بيانات جلسة القضية رقم ${
        caseData?.caseNumber || ""
      }`,
      createdBy: req.user.id,
    });

    return res.status(200).json({
      message: "تم تحديث الجلسة بنجاح",
      session,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Session By ID
// ==========================================

const getSessionById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const officeId = await getOfficeId(req);

    if (!officeId) {
      throw new AppError("غير مسموح لك بعرض الجلسة", 403);
    }

    const session = await sessionModel
      .findOne({
        _id: id,
        officeId,
      })
      .populate("caseId", "caseNumber title court status");

    if (!session) {
      throw new AppError("لم يتم العثور على الجلسة", 404);
    }

    return res.status(200).json({
      message: "تم العثور على الجلسة بنجاح",
      session,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Export
// ==========================================

export {
  handleAddSession,
  getSessions,
  deleteSession,
  updateSession,
  getSessionById,
};
