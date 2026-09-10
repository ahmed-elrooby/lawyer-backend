import caseModel from "../models/case.model.js";
import ClientModel from "../models/clients.model.js";
import officeModel from "../models/office.model.js";
import sessionModel from "../models/session.model.js";
import UserModel from "../models/User.model.js";

const getDashboardStatistics = async (req, res) => {
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
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
      }

      officeId = office._id;
    } else if (req.user.role === "lawyer") {
      const user = await UserModel.findById(req.user.id).select("officeId");

      if (!user || !user.officeId) {
        return res.status(404).json({
          message: "المستخدم غير مرتبط بمكتب",
        });
      }

      officeId = user.officeId;
    } else if (req.user.role === "admin") {
      // الـ Admin يشوف الإحصائيات العامة
      officeId = null;
    }

    // =========================
    // Filters
    // =========================

    const clientFilter = officeId ? { officeId } : {};

    const caseFilter = officeId ? { officeId } : {};

    const sessionFilter = officeId ? { officeId } : {};

    const lawyerFilter = officeId
      ? {
          officeId,
          role: "lawyer",
        }
      : {
          role: "lawyer",
        };

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
      ClientModel.countDocuments(clientFilter),

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
    console.log(error);

    res.status(500).json({
      message: "حدث خطأ في السيرفر",
    });
  }
};

export default getDashboardStatistics;
