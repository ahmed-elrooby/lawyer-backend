
import timeLineModel from "../models/timeLine.model.js";
import UserModel from "../models/User.model.js";
import officeModel from "../models/office.model.js";
import caseModel from "../models/case.model.js";
import AppError from "../utils/AppError.js";

const getTimeLine = async (req, res, next) => {
  try {
    const { caseId, clientId } = req.query;

    const filter = {};

    // ==========================================
    // ADMIN
    // ==========================================
    if (req.user.role === "admin") {
      // Admin يشوف كل الـ Timeline
    }

    // ==========================================
    // OFFICE OWNER
    // ==========================================
    else if (req.user.role === "office_owner") {
      const office = await officeModel
        .findOne({
          Owner_id: req.user.id,
        })
        .select("_id");

      if (!office) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      filter.officeId = office._id;

      // لو المستخدم طلب Timeline لقضية معينة
      if (caseId) {
        const caseData = await caseModel
          .findOne({
            _id: caseId,
            officeId: office._id,
          })
          .select("_id");

        if (!caseData) {
          throw new AppError(
            "القضية غير موجودة أو غير مصرح لك بالوصول إليها",
            403,
          );
        }

        filter.caseId = caseData._id;
      }
    }

    // ==========================================
    // LAWYER
    // ==========================================
    else if (req.user.role === "lawyer") {
      const user = await UserModel.findById(req.user.id).select(
        "_id officeId",
      );

      if (!user) {
        throw new AppError("المستخدم غير موجود", 404);
      }

      // ========================================
      // LAWYER + CASE ID
      // ========================================
      if (caseId) {
        const caseData = await caseModel
          .findOne({
            _id: caseId,
            lawyers: user._id,
          })
          .select("_id officeId");

        if (!caseData) {
          throw new AppError(
            "القضية غير موجودة أو غير مصرح لك بالوصول إليها",
            403,
          );
        }

        filter.caseId = caseData._id;

        // Timeline الخاص بالقضية
        if (caseData.officeId) {
          filter.officeId = caseData.officeId;
        } else {
          filter.officeId = null;
        }
      }

      // ========================================
      // LAWYER WITHOUT CASE ID
      // ========================================
      else {
        const lawyerCases = await caseModel
          .find({
            lawyers: user._id,
            ...(user.officeId
              ? { officeId: user.officeId }
              : { officeId: null }),
          })
          .select("_id");

        const caseIds = lawyerCases.map((item) => item._id);

        // المحامي المستقل
        if (!user.officeId) {
          filter.officeId = null;
        }

        // المحامي التابع لمكتب
        else {
          filter.officeId = user.officeId;
        }

        filter.caseId = {
          $in: caseIds,
        };
      }
    }

    // ==========================================
    // CLIENT FILTER
    // ==========================================
    if (clientId) {
      filter.clientId = clientId;
    }

    // ==========================================
    // GET TIMELINE
    // ==========================================
    const timeLine = await timeLineModel
      .find(filter)
      .populate("caseId", "caseNumber title")
      .populate("clientId", "name phone")
      .populate("sessionId", "title sessionDate sessionTime")
      .populate("attachmentId", "name originalName")
      .populate("noteId", "content")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "تم استرجاع الـ Timeline بنجاح",
      count: timeLine.length,
      timeLine,
    });
  } catch (error) {
    next(error);
  }
};

export { getTimeLine };
