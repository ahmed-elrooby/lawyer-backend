import timeLineModel from "../models/timeLine.model.js";
import UserModel from "../models/User.model.js";
import officeModel from "./../models/office.model.js";

const getTimeLine = async (req, res) => {
  try {
    let officeId = null;

    // صاحب المكتب
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
    }

    // المحامي
    if (req.user.role === "lawyer") {
      const user = await UserModel.findById(req.user.id).select("officeId");

      if (!user || !user.officeId) {
        return res.status(404).json({
          message: "لم يتم العثور على مكتب المحامي",
        });
      }

      officeId = user.officeId;
    }

    // الفلاتر
    const { caseId, clientId } = req.query;

    const filter = {};

    // Admin يشوف كل الـ Timeline
    // باقي المستخدمين يشوفوا Timeline مكتبهم فقط
    if (req.user.role !== "admin") {
      if (!officeId) {
        return res.status(403).json({
          message: "غير مصرح لك بعرض الـ Timeline",
        });
      }

      filter.officeId = officeId;
    }

    // فلترة اختيارية بالقضية
    if (caseId) {
      filter.caseId = caseId;
    }

    // فلترة اختيارية بالعميل
    if (clientId) {
      filter.clientId = clientId;
    }

    const timeLine = await timeLineModel
      .find(filter)
      .populate("caseId", "caseNumber title")
      .populate("clientId", "name phone")
      .populate("sessionId", "title sessionDate sessionTime")
      .populate("attachmentId", "name originalName")
      .populate("noteId", "content")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "تم استرجاع الـ Timeline بنجاح",
      count: timeLine.length,
      timeLine,
    });
  } catch (error) {
    console.error("Get TimeLine Error:", error);

    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};

export { getTimeLine };
