import caseModel from "../models/case.model.js";
import officeModel from "../models/office.model.js";
import sessionModel from "../models/session.model.js";
import UserModel from "../models/User.model.js";
import createTimeLine from "../services/timeline.service.js";

const handleAddSession = async (req, res) => {
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
      const lawyer = await UserModel.findById(req.user.id);

      if (!lawyer || !lawyer.officeId) {
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
      }

      officeId = lawyer.officeId;
    }

    if (!officeId) {
      return res.status(403).json({
        message: "غير مسموح لك بإضافة جلسة",
      });
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
      officeId: officeId,
    });

    if (!caseData) {
      return res.status(404).json({
        message: "لم يتم العثور على القضية",
      });
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

    res.status(201).json({
      message: "تم إضافة الجلسة بنجاح",
      session: newSession,
    });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({
        message: "هذه الجلسة موجودة بالفعل لنفس القضية في نفس التاريخ والوقت",
      });
    }

    if (e.name === "ValidationError") {
      return res.status(400).json({
        message: "بيانات الجلسة غير صحيحة",
        errors: Object.values(e.errors).map((error) => error.message),
      });
    }

    if (e.name === "CastError") {
      return res.status(400).json({
        message: "معرف القضية غير صحيح",
      });
    }

    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};
const getSessions = async (req, res) => {
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
      const lawyer = await UserModel.findById(req.user.id);

      if (!lawyer || !lawyer.officeId) {
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
      }

      officeId = lawyer.officeId;
    }

    if (!officeId) {
      return res.status(403).json({
        message: "غير مسموح لك بعرض الجلسات",
      });
    }

    const sessions = await sessionModel
      .find({
        officeId: officeId,
      })
      .populate("caseId", "caseNumber title")
      .populate("officeId", "name")
      .sort({ sessionDate: 1 });

    res.status(200).json({
      sessions,
    });
  } catch (e) {
    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};
const deleteSession = async (req, res) => {
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
      const lawyer = await UserModel.findById(req.user.id);

      if (!lawyer || !lawyer.officeId) {
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
      }

      officeId = lawyer.officeId;
    }

    if (!officeId) {
      return res.status(403).json({
        message: "غير مسموح لك بحذف الجلسات",
      });
    }

    const session = await sessionModel.findOneAndDelete({
      _id: id,
      officeId: officeId,
    });

    if (!session) {
      return res.status(404).json({
        message: "لم يتم العثور على الجلسة",
      });
    }

    res.status(200).json({
      message: "تم حذف الجلسة بنجاح",
    });
  } catch (e) {
    if (e.name === "CastError") {
      return res.status(400).json({
        message: "معرف الجلسة غير صحيح",
      });
    }

    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};

const updateSession = async (req, res) => {
  const { id } = req.params;

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
      const lawyer = await UserModel.findById(req.user.id);

      if (!lawyer || !lawyer.officeId) {
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
      }

      officeId = lawyer.officeId;
    }

    if (!officeId) {
      return res.status(403).json({
        message: "غير مسموح لك بتعديل الجلسات",
      });
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

    if (caseId !== undefined) updateData.caseId = caseId;
    if (title !== undefined) updateData.title = title;
    if (sessionDate !== undefined) updateData.sessionDate = sessionDate;
    if (sessionTime !== undefined) updateData.sessionTime = sessionTime;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (decision !== undefined) updateData.decision = decision;

    if (nextSessionDate !== undefined) {
      updateData.nextSessionDate = nextSessionDate;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "لم يتم إرسال أي بيانات للتعديل",
      });
    }

    // لو بيغير القضية، نتأكد أن القضية الجديدة تابعة لنفس المكتب
    if (caseId !== undefined) {
      const caseData = await caseModel.findOne({
        _id: caseId,
        officeId: officeId,
      });

      if (!caseData) {
        return res.status(404).json({
          message: "القضية غير موجودة أو لا تتبع هذا المكتب",
        });
      }
    }

    const session = await sessionModel.findOneAndUpdate(
      {
        _id: id,
        officeId: officeId,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!session) {
      return res.status(404).json({
        message: "لم يتم العثور على الجلسة",
      });
    }

    // جلب القضية المرتبطة بالجلسة بعد التعديل
    const caseData = await caseModel.findOne({
      _id: session.caseId,
      officeId: officeId,
    });

    // تسجيل الحدث في Timeline
    await createTimeLine({
      officeId,
      caseId: session.caseId,
      sessionId: session._id,
      type: "session_updated",
      title: "تم تعديل الجلسة",
      description: `تم تعديل بيانات جلسة القضية رقم ${caseData?.caseNumber || ""}`,
      createdBy: req.user.id,
    });

    return res.status(200).json({
      message: "تم تحديث الجلسة بنجاح",
      session,
    });
  } catch (e) {
    // Duplicate session
    if (e.code === 11000) {
      return res.status(409).json({
        message: "هذه الجلسة موجودة بالفعل لنفس القضية في نفس التاريخ والوقت",
      });
    }

    // Validation error
    if (e.name === "ValidationError") {
      return res.status(400).json({
        message: "بيانات الجلسة غير صحيحة",
        errors: Object.values(e.errors).map((error) => error.message),
      });
    }

    // Invalid ObjectId
    if (e.name === "CastError") {
      return res.status(400).json({
        message: "معرف الجلسة أو القضية غير صحيح",
      });
    }

    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};

const getSessionById = async (req, res) => {
  const { id } = req.params;

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
      const lawyer = await UserModel.findById(req.user.id);

      if (!lawyer || !lawyer.officeId) {
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
      }

      officeId = lawyer.officeId;
    }

    if (!officeId) {
      return res.status(403).json({
        message: "غير مسموح لك بعرض الجلسة",
      });
    }

    const session = await sessionModel
      .findOne({
        _id: id,
        officeId: officeId,
      })
      .populate("caseId", "caseNumber title court status");

    if (!session) {
      return res.status(404).json({
        message: "لم يتم العثور على الجلسة",
      });
    }

    return res.status(200).json({
      message: "تم العثور على الجلسة بنجاح",
      session,
    });
  } catch (e) {
    if (e.name === "CastError") {
      return res.status(400).json({
        message: "معرف الجلسة غير صحيح",
      });
    }

    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};

export {
  handleAddSession,
  getSessions,
  deleteSession,
  updateSession,
  getSessionById,
};
