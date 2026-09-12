import caseModel from "../models/case.model.js";
import ClientModel from "../models/clients.model.js";
import officeModel from "../models/office.model.js";
import sessionModel from "../models/session.model.js";
import UserModel from "../models/User.model.js";
import AppError from "../utils/AppError.js";

const getDashboardStatistics = async (req, res, next) => {
  try {
    let officeId;

    // =========================
    // تحديد المكتب
    // =========================

    if (req.user.role === "office_owner") {
      const office = await officeModel
        .findOne({
          Owner_id: req.user.id,
        })
        .select("_id");

      if (!office) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = office._id;
    } else if (req.user.role === "lawyer") {
      const user = await UserModel.findById(req.user.id).select("officeId");

      if (!user || !user.officeId) {
        throw new AppError("المستخدم غير مرتبط بمكتب", 404);
      }

      officeId = user.officeId;
    } else if (req.user.role === "admin") {
      // Admin يشوف الإحصائيات العامة
      officeId = null;
    }

    // =========================
    // Filters
    // =========================

    let clientFilter = {};
    let caseFilter = {};
    let sessionFilter = {};
    let lawyerFilter = {};

    // =========================
    // Admin
    // =========================

    if (req.user.role === "admin") {
      // إحصائيات عامة على مستوى النظام

      clientFilter = {};

      caseFilter = {};

      sessionFilter = {};

      lawyerFilter = {
        role: "lawyer",
      };
    }

    // =========================
    // Office Owner
    // =========================

    if (req.user.role === "office_owner") {
      // صاحب المكتب يشوف كل بيانات مكتبه

      clientFilter = {
        officeId,
      };

      caseFilter = {
        officeId,
      };

      sessionFilter = {
        officeId,
      };

      lawyerFilter = {
        officeId,
        role: "lawyer",
      };
    }

    // =========================
    // Lawyer
    // =========================

    if (req.user.role === "lawyer") {
      // المحامي يشوف القضايا المسندة إليه فقط

      caseFilter = {
        officeId,
        lawyers: req.user.id,
      };

      // جلب القضايا المسندة للمحامي
      const assignedCases = await caseModel
        .find(caseFilter)
        .select("_id clientId");

      // IDs القضايا
      const assignedCaseIds = assignedCases.map((caseItem) => caseItem._id);

      // IDs العملاء المرتبطين بقضايا المحامي
      const assignedClientIds = [
        ...new Set(
          assignedCases
            .map((caseItem) => caseItem.clientId?.toString())
            .filter(Boolean),
        ),
      ];

      // العملاء المرتبطين بقضايا المحامي فقط
      clientFilter = {
        officeId,
        _id: {
          $in: assignedClientIds,
        },
      };

      // الجلسات الخاصة بقضايا المحامي فقط
      sessionFilter = {
        officeId,
        caseId: {
          $in: assignedCaseIds,
        },
      };

      // المحامي نفسه
      lawyerFilter = {
        _id: req.user.id,
        role: "lawyer",
      };
    }

    // =========================
    // Statistics
    // =========================

    const [
      totalClients,
      totalCases,
      activeCases,
      reservedForJudgmentCases,
      judgedCases,

      totalSessions,
      scheduledSessions,
      attendedSessions,
      postponedSessions,
      completedSessions,
      cancelledSessions,

      totalLawyers,
    ] = await Promise.all([
      // =========================
      // Clients
      // =========================

      ClientModel.countDocuments(clientFilter),

      // =========================
      // Cases
      // =========================

      caseModel.countDocuments(caseFilter),

      caseModel.countDocuments({
        ...caseFilter,
        status: "active",
      }),

      caseModel.countDocuments({
        ...caseFilter,
        status: "reserved_for_judgment",
      }),

      caseModel.countDocuments({
        ...caseFilter,
        status: "judged",
      }),

      // =========================
      // Sessions
      // =========================

      sessionModel.countDocuments(sessionFilter),

      sessionModel.countDocuments({
        ...sessionFilter,
        status: "scheduled",
      }),

      sessionModel.countDocuments({
        ...sessionFilter,
        status: "attended",
      }),

      sessionModel.countDocuments({
        ...sessionFilter,
        status: "postponed",
      }),

      sessionModel.countDocuments({
        ...sessionFilter,
        status: "completed",
      }),

      sessionModel.countDocuments({
        ...sessionFilter,
        status: "cancelled",
      }),

      // =========================
      // Lawyers
      // =========================

      UserModel.countDocuments(lawyerFilter),
    ]);

    // =========================
    // Response
    // =========================

    res.status(200).json({
      message: "تم جلب الإحصائيات بنجاح",

      statistics: {
        clients: {
          total: totalClients,
        },

        cases: {
          total: totalCases,
          active: activeCases,
          reservedForJudgment: reservedForJudgmentCases,
          judged: judgedCases,
        },

        sessions: {
          total: totalSessions,
          scheduled: scheduledSessions,
          attended: attendedSessions,
          postponed: postponedSessions,
          completed: completedSessions,
          cancelled: cancelledSessions,
        },

        lawyers: {
          total: totalLawyers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export default getDashboardStatistics;
