import caseModel from "../models/case.model.js";
import officeModel from "../models/office.model.js";
import sessionModel from "../models/session.model.js";
import UserModel from "../models/User.model.js";
import createTimeLine from "../services/timeline.service.js";
import AppError from "../utils/AppError.js";

// ==========================================
// Get User + Scope
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
    };
  }

  // ==========================================
  // Lawyer
  // ==========================================

  if (user.role === "lawyer") {
    // Lawyer داخل مكتب
    if (user.officeId) {
      return {
        user,
        officeId: user.officeId,
        isIndependent: false,
      };
    }

    // Lawyer مستقل
    return {
      user,
      officeId: null,
      isIndependent: true,
    };
  }

  throw new AppError("غير مسموح لك بتنفيذ هذا الإجراء", 403);
};

// ==========================================
// Get Case By User Scope
// ==========================================

const getCaseByScope = async ({ caseId, user, officeId }) => {
  // ==========================================
  // Office Owner
  // ==========================================

  if (user.role === "office_owner") {
    return await caseModel.findOne({
      _id: caseId,
      officeId,
    });
  }

  // ==========================================
  // Lawyer
  // ==========================================

  if (user.role === "lawyer") {
    // Lawyer داخل مكتب
    if (user.officeId) {
      return await caseModel.findOne({
        _id: caseId,
        officeId: user.officeId,
        lawyers: user._id,
      });
    }

    // Lawyer مستقل
    return await caseModel.findOne({
      _id: caseId,
      officeId: null,
      lawyers: user._id,
    });
  }

  return null;
};

// ==========================================
// Get Session By User Scope
// ==========================================

const getSessionByScope = async ({ sessionId, user, officeId }) => {
  // ==========================================
  // Office Owner
  // ==========================================

  if (user.role === "office_owner") {
    return await sessionModel.findOne({
      _id: sessionId,
      officeId,
    });
  }

  // ==========================================
  // Lawyer
  // ==========================================

  if (user.role === "lawyer") {
    // Lawyer داخل مكتب
    if (user.officeId) {
      return await sessionModel.findOne({
        _id: sessionId,
        officeId: user.officeId,
      });
    }

    // Lawyer مستقل
    // لازم الجلسة تكون مرتبطة بقضية يملكها المحامي
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

  return null;
};

// ==========================================
// Add Session
// ==========================================

const handleAddSession = async (req, res, next) => {
  try {
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

    // ==========================================
    // Get User Scope
    // ==========================================

    const { user, officeId } = await getUserScope(req);

    // ==========================================
    // Get Case
    // ==========================================

    const caseData = await getCaseByScope({
      caseId,
      user,
      officeId,
    });

    if (!caseData) {
      throw new AppError(
        "القضية غير موجودة أو لا تملك صلاحية إضافة جلسة لها",
        403,
      );
    }

    // ==========================================
    // Create Session
    // ==========================================

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

    // ==========================================
    // Timeline
    // ==========================================

    await createTimeLine({
      officeId,
      caseId: newSession.caseId,
      sessionId: newSession._id,
      type: "session_created",
      title: "تم إضافة جلسة جديدة",
      description: `تم إضافة جلسة جديدة للقضية رقم ${caseData.caseNumber}`,
      createdBy: user._id,
    });

    // ==========================================
    // Response
    // ==========================================

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
    const { user, officeId } = await getUserScope(req);

    let sessions;

    // ==========================================
    // Office Owner
    // ==========================================

    if (user.role === "office_owner") {
      sessions = await sessionModel
        .find({
          officeId,
        })
        .populate("caseId", "caseNumber title court status")
        .populate("officeId", "name")
        .sort({
          sessionDate: 1,
          sessionTime: 1,
        });
    }

    // ==========================================
    // Lawyer
    // ==========================================

    if (user.role === "lawyer") {
      // ----------------------------------------
      // Lawyer داخل مكتب
      // ----------------------------------------

      if (user.officeId) {
        sessions = await sessionModel
          .find({
            officeId: user.officeId,
          })
          .populate("caseId", "caseNumber title court status")
          .populate("officeId", "name")
          .sort({
            sessionDate: 1,
            sessionTime: 1,
          });
      }

      // ----------------------------------------
      // Independent Lawyer
      // ----------------------------------------

      else {
        const cases = await caseModel
          .find({
            officeId: null,
            lawyers: user._id,
          })
          .select("_id");

        const caseIds = cases.map((item) => item._id);

        sessions = await sessionModel
          .find({
            officeId: null,
            caseId: {
              $in: caseIds,
            },
          })
          .populate("caseId", "caseNumber title court status")
          .sort({
            sessionDate: 1,
            sessionTime: 1,
          });
      }
    }

    return res.status(200).json({
      sessions: sessions || [],
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
    const { user, officeId } = await getUserScope(req);

    // ==========================================
    // Get Session
    // ==========================================

    const session = await getSessionByScope({
      sessionId: id,
      user,
      officeId,
    });

    if (!session) {
      throw new AppError("لم يتم العثور على الجلسة", 404);
    }

    // ==========================================
    // Delete Session
    // ==========================================

    await sessionModel.findByIdAndDelete(session._id);

    // ==========================================
    // Timeline
    // ==========================================

    await createTimeLine({
      officeId,
      caseId: session.caseId,
      sessionId: null,
      type: "session_updated",
      title: "تم حذف الجلسة",
      description: "تم حذف جلسة من القضية",
      createdBy: user._id,
    });

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

    // ==========================================
    // Get User Scope
    // ==========================================

    const { user, officeId } = await getUserScope(req);

    // ==========================================
    // Get Existing Session
    // ==========================================

    const existingSession = await getSessionByScope({
      sessionId: id,
      user,
      officeId,
    });

    if (!existingSession) {
      throw new AppError("لم يتم العثور على الجلسة", 404);
    }

    // ==========================================
    // Prepare Update
    // ==========================================

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

    // ==========================================
    // Validate New Case
    // ==========================================

    let caseData;

    if (caseId !== undefined) {
      caseData = await getCaseByScope({
        caseId,
        user,
        officeId,
      });

      if (!caseData) {
        throw new AppError(
          "القضية غير موجودة أو لا تملك صلاحية استخدامها",
          403,
        );
      }
    } else {
      caseData = await getCaseByScope({
        caseId: existingSession.caseId,
        user,
        officeId,
      });

      if (!caseData) {
        throw new AppError(
          "القضية المرتبطة بالجلسة غير موجودة",
          404,
        );
      }
    }

    // ==========================================
    // Update Session
    // ==========================================

    const session = await sessionModel.findByIdAndUpdate(
      existingSession._id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!session) {
      throw new AppError("لم يتم العثور على الجلسة", 404);
    }

    // ==========================================
    // Timeline
    // ==========================================

    await createTimeLine({
      officeId,
      caseId: session.caseId,
      sessionId: session._id,
      type: "session_updated",
      title: "تم تعديل الجلسة",
      description: `تم تعديل بيانات جلسة القضية رقم ${
        caseData?.caseNumber || ""
      }`,
      createdBy: user._id,
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
    const { user, officeId } = await getUserScope(req);

    // ==========================================
    // Get Session
    // ==========================================

    const session = await getSessionByScope({
      sessionId: id,
      user,
      officeId,
    });

    if (!session) {
      throw new AppError("لم يتم العثور على الجلسة", 404);
    }

    // ==========================================
    // Populate
    // ==========================================

    await session.populate([
      {
        path: "caseId",
        select: "caseNumber title court status",
      },
      {
        path: "officeId",
        select: "name",
      },
    ]);

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