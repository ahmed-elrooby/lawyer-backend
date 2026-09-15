import * as XLSX from "xlsx";

import caseModel from "../models/case.model.js";
import ClientModel from "../models/clients.model.js";
import officeModel from "../models/office.model.js";
import sessionModel from "../models/session.model.js";
import UserModel from "../models/User.model.js";
import AppError from "../utils/AppError.js";

const getDashboardStatistics = async (req, res, next) => {
  try {
    let officeId;

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

      if (!user) {
        throw new AppError("المستخدم غير موجود", 404);
      }

      // المحامي ممكن يكون مستقل أو تابع لمكتب
      officeId = user.officeId || null;
    } else if (req.user.role === "admin") {
      officeId = null;
    }

    let clientFilter = {};
    let caseFilter = {};
    let sessionFilter = {};
    let lawyerFilter = {};

    if (req.user.role === "admin") {
      clientFilter = {};
      caseFilter = {};
      sessionFilter = {};
      lawyerFilter = {
        role: "lawyer",
      };
    }

    if (req.user.role === "office_owner") {
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

    if (req.user.role === "lawyer") {
      caseFilter = {
        lawyers: req.user.id,
      };

      if (officeId) {
        caseFilter.officeId = officeId;
      }

      const assignedCases = await caseModel
        .find(caseFilter)
        .select("_id clientId");

      const assignedCaseIds = assignedCases.map(
        (caseItem) => caseItem._id
      );

      const assignedClientIds = [
        ...new Set(
          assignedCases
            .map((caseItem) => caseItem.clientId?.toString())
            .filter(Boolean)
        ),
      ];

      clientFilter = {
        _id: {
          $in: assignedClientIds,
        },
      };

      if (officeId) {
        clientFilter.officeId = officeId;
      }

      sessionFilter = {
        caseId: {
          $in: assignedCaseIds,
        },
      };

      if (officeId) {
        sessionFilter.officeId = officeId;
      }

      lawyerFilter = {
        _id: req.user.id,
        role: "lawyer",
      };
    }

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

    const statistics = {
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
    };

    // عدد المحامين يظهر للـ Admin و Office Owner فقط
    if (req.user.role !== "lawyer") {
      statistics.lawyers = {
        total: totalLawyers,
      };
    }

    res.status(200).json({
      message: "تم جلب الإحصائيات بنجاح",
      statistics,
    });
  } catch (error) {
    next(error);
  }
};

const exportDashboardStatistics = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      throw new AppError("غير مسموح لك بتصدير الإحصائيات", 403);
    }

    const clientFilter = {};
    const caseFilter = {};
    const sessionFilter = {};
    const lawyerFilter = {
      role: "lawyer",
    };

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

    const calculatePercentage = (value, total) => {
      if (!total) return 0;

      return Math.round((value / total) * 100);
    };

    const activeCasesPercentage = calculatePercentage(
      activeCases,
      totalCases
    );

    const reservedForJudgmentPercentage = calculatePercentage(
      reservedForJudgmentCases,
      totalCases
    );

    const scheduledSessionsPercentage = calculatePercentage(
      scheduledSessions,
      totalSessions
    );

    const postponedSessionsPercentage = calculatePercentage(
      postponedSessions,
      totalSessions
    );

    const reportData = [
      ["تقرير إحصائيات النظام"],
      [],

      ["القضايا"],
      ["البيان", "العدد", "النسبة"],

      ["إجمالي القضايا", totalCases, "100%"],

      [
        "القضايا النشطة",
        activeCases,
        `${activeCasesPercentage}%`,
      ],

      [
        "القضايا المحجوزة للحكم",
        reservedForJudgmentCases,
        `${reservedForJudgmentPercentage}%`,
      ],

      ["القضايا التي تم الحكم فيها", judgedCases, ""],

      [],

      ["الجلسات"],
      ["البيان", "العدد", "النسبة"],

      ["إجمالي الجلسات", totalSessions, "100%"],

      [
        "الجلسات المجدولة",
        scheduledSessions,
        `${scheduledSessionsPercentage}%`,
      ],

      ["الجلسات التي تم حضورها", attendedSessions, ""],

      [
        "الجلسات المؤجلة",
        postponedSessions,
        `${postponedSessionsPercentage}%`,
      ],

      ["الجلسات المكتملة", completedSessions, ""],

      ["الجلسات الملغاة", cancelledSessions, ""],

      [],

      ["المستخدمون"],
      ["البيان", "العدد"],

      ["إجمالي العملاء", totalClients],

      ["إجمالي المحامين", totalLawyers],

      [],

      ["مؤشرات الأداء"],
      ["المؤشر", "النسبة"],

      [
        "نسبة القضايا النشطة",
        `${activeCasesPercentage}%`,
      ],

      [
        "نسبة القضايا المحجوزة للحكم",
        `${reservedForJudgmentPercentage}%`,
      ],

      [
        "نسبة الجلسات المجدولة",
        `${scheduledSessionsPercentage}%`,
      ],

      [
        "نسبة الجلسات المؤجلة",
        `${postponedSessionsPercentage}%`,
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(reportData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "الإحصائيات"
    );

    worksheet["!cols"] = [
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
    ];

    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="dashboard-statistics.xlsx"'
    );

    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

export {
  getDashboardStatistics,
  exportDashboardStatistics,
};