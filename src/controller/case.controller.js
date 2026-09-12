import caseModel from "../models/case.model.js";
import officeModel from "../models/office.model.js";
import UserModel from "../models/User.model.js";
import createTimeLine from "../services/timeline.service.js";
import AppError from "../utils/AppError.js";

const handleAddCase = async (req, res, next) => {
  try {
    let officeId;

    // البيانات القادمة من Frontend
    const {
      clientId,
      lawyers,
      caseTypeId,
      caseNumber,
      title,
      court,
      status,
      filingDate,
      nextHearingDate,
      description,
      notes,
    } = req.body;

    // صاحب المكتب
    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = office._id;
    }

    // المحامي
    if (req.user.role === "lawyer") {
      const lawyer = await UserModel.findById(req.user.id);

      if (!lawyer || !lawyer.officeId) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = lawyer.officeId;
    }

    // لو Role غير مسموح
    if (!officeId) {
      throw new AppError("غير مسموح لك بإنشاء قضية", 403);
    }

    // إنشاء القضية
    const newCase = new caseModel({
      officeId,
      clientId,
      lawyers,
      caseTypeId,
      caseNumber,
      title,
      court,
      status,
      filingDate,
      nextHearingDate,
      description,
      notes,
    });

    await newCase.save();

    await createTimeLine({
      officeId,
      caseId: newCase._id,
      clientId: newCase.clientId,
      type: "case_created",
      title: "تم إنشاء القضية",
      description: `تم إنشاء القضية رقم ${newCase.caseNumber}`,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "تم إنشاء القضية بنجاح",
      newCase,
    });
  } catch (e) {
    next(e);
  }
};
const getCases = async (req, res, next) => {
  try {
    let filter = {
      isArchived: false,
    };

    // صاحب المكتب
    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      filter.officeId = office._id;
    }

    // المحامي
    if (req.user.role === "lawyer") {
      const lawyer = await UserModel.findById(req.user.id).select("officeId");

      if (!lawyer || !lawyer.officeId) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      filter.officeId = lawyer.officeId;
    }

    // admin لا يحتاج officeId
    // وبالتالي سيجلب كل القضايا

    const cases = await caseModel
      .find(filter)
      .populate("clientId", "name phone")
      .populate("lawyers", "name email")
      .populate("caseTypeId", "name")
      .populate("officeId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      cases,
    });
  } catch (e) {
    next(e);
  }
};
const deleteCase = async (req, res, next) => {
  try {
    let officeId;

    // صاحب المكتب
    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = office._id;
    }

    // المحامي
    if (req.user.role === "lawyer") {
      const lawyer = await UserModel.findById(req.user.id);

      if (!lawyer || !lawyer.officeId) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = lawyer.officeId;
    }

    // التأكد من الصلاحية
    if (!officeId) {
      throw new AppError("غير مسموح لك بحذف القضية", 403);
    }

    const { id } = req.params;

    // حذف القضية بشرط تكون تابعة لنفس المكتب
    const deletedCase = await caseModel.findOneAndDelete({
      _id: id,
      officeId: officeId,
    });

    if (!deletedCase) {
      throw new AppError("لم يتم العثور على القضيه", 404);
    }

    res.status(200).json({
      message: "تم حذف القضية بنجاح",
    });
  } catch (e) {
    next(e);
  }
};
const getCaseById = async (req, res, next) => {
  try {
    let officeId;

    // صاحب المكتب
    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = office._id;
    }

    // المحامي
    if (req.user.role === "lawyer") {
      const lawyer = await UserModel.findById(req.user.id);

      if (!lawyer || !lawyer.officeId) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = lawyer.officeId;
    }

    // التأكد من الصلاحية
    if (!officeId) {
      throw new AppError("غير مسموح لك بعرض القضية", 403);
    }

    const { id } = req.params;

    const caseData = await caseModel
      .findOne({
        _id: id,
        officeId: officeId,
        isArchived: false,
      })
      .populate("clientId", "name phone")
      .populate("lawyers", "name email")
      .populate("caseTypeId", "name")
      .populate("officeId", "name");

    if (!caseData) {
      throw new AppError("لم يتم العثور على القضية", 404);
    }

    res.status(200).json({
      caseData,
    });
  } catch (e) {
    next(e);
  }
};
const updateCase = async (req, res, next) => {
  try {
    let officeId;

    // صاحب المكتب
    if (req.user.role === "office_owner") {
      const office = await officeModel.findOne({
        Owner_id: req.user.id,
      });

      if (!office) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = office._id;
    }

    // المحامي
    if (req.user.role === "lawyer") {
      const lawyer = await UserModel.findById(req.user.id);

      if (!lawyer || !lawyer.officeId) {
        throw new AppError("لم يتم العثور على المكتب", 404);
      }

      officeId = lawyer.officeId;
    }

    // التأكد من الصلاحية
    if (!officeId) {
      throw new AppError("غير مسموح لك بتعديل القضية", 403);
    }

    const { id } = req.params;

    const {
      clientId,
      lawyers,
      caseTypeId,
      caseNumber,
      title,
      court,
      status,
      filingDate,
      nextHearingDate,
      description,
      notes,
      isArchived,
    } = req.body;

    const updatedCase = await caseModel.findOneAndUpdate(
      {
        _id: id,
        officeId: officeId,
      },
      {
        clientId,
        lawyers,
        caseTypeId,
        caseNumber,
        title,
        court,
        status,
        filingDate,
        nextHearingDate,
        description,
        notes,
        isArchived,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedCase) {
      throw new AppError("لم يتم العثور على القضيه", 404);
    }

    // إضافة Timeline Event
    await createTimeLine({
      officeId,
      caseId: updatedCase._id,
      clientId: updatedCase.clientId,
      type: "case_updated",
      title: "تم تعديل القضية",
      description: `تم تعديل بيانات القضية رقم ${updatedCase.caseNumber}`,
      createdBy: req.user.id,
    });

    return res.status(200).json({
      message: "تم تحديث القضية بنجاح",
      updatedCase,
    });
  } catch (e) {
    next(e);
  }
};
export { handleAddCase, getCases, deleteCase, getCaseById, updateCase };
