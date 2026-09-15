import caseModel from "../models/case.model.js";
import officeModel from "../models/office.model.js";
import UserModel from "../models/User.model.js";
import createTimeLine from "../services/timeline.service.js";
import AppError from "../utils/AppError.js";

/*
|--------------------------------------------------------------------------
| Get User Scope
|--------------------------------------------------------------------------
| بنحدد هل المستخدم تابع لمكتب ولا محامي مستقل
*/

const getUserScope = async (req) => {
  // =========================
  // Office Owner
  // =========================
  if (req.user.role === "office_owner") {
    const office = await officeModel.findOne({
      Owner_id: req.user.id,
    });

    if (!office) {
      throw new AppError("لم يتم العثور على المكتب", 404);
    }

    return {
      role: "office_owner",
      officeId: office._id,
      lawyerId: null,
    };
  }

  // =========================
  // Lawyer
  // =========================
  if (req.user.role === "lawyer") {
    const lawyer = await UserModel.findById(req.user.id).select(
      "officeId role",
    );

    if (!lawyer) {
      throw new AppError("المستخدم غير موجود", 404);
    }

    return {
      role: "lawyer",
      officeId: lawyer.officeId || null,
      lawyerId: lawyer._id,
    };
  }

  // =========================
  // Admin
  // =========================
  if (req.user.role === "admin") {
    return {
      role: "admin",
      officeId: null,
      lawyerId: null,
    };
  }

  throw new AppError("غير مصرح لك بالوصول", 403);
};

/*
|--------------------------------------------------------------------------
| Add Case
|--------------------------------------------------------------------------
*/

const handleAddCase = async (req, res, next) => {
  try {
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

    const scope = await getUserScope(req);

    let officeId = scope.officeId;

    let caseLawyers = Array.isArray(lawyers)
      ? lawyers
      : [];

    // ==================================================
    // Lawyer
    // ==================================================

    if (req.user.role === "lawyer") {
      // المحامي لازم يكون موجود داخل lawyers
      caseLawyers = [req.user.id];
    }

    // ==================================================
    // Office Owner
    // ==================================================

    if (req.user.role === "office_owner") {
      if (!officeId) {
        throw new AppError(
          "لم يتم العثور على المكتب",
          404,
        );
      }

      if (!caseLawyers.length) {
        throw new AppError(
          "يجب تحديد محامي للقضية",
          400,
        );
      }
    }

    // ==================================================
    // التأكد من وجود محامي
    // ==================================================

    if (!caseLawyers.length) {
      throw new AppError(
        "يجب تحديد محامي للقضية",
        400,
      );
    }

    // ==================================================
    // إنشاء القضية
    // ==================================================

    const newCase = new caseModel({
      officeId,
      clientId,
      lawyers: caseLawyers,
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

    // ==================================================
    // Timeline
    // ==================================================

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

/*
|--------------------------------------------------------------------------
| Get Cases
|--------------------------------------------------------------------------
*/

const getCases = async (req, res, next) => {
  try {
    const scope = await getUserScope(req);

    let filter = {
      isArchived: false,
    };

    // ==================================================
    // Office Owner
    // ==================================================

    if (req.user.role === "office_owner") {
      filter.officeId = scope.officeId;
    }

    // ==================================================
    // Lawyer
    // ==================================================

    if (req.user.role === "lawyer") {
      // لو المحامي تابع لمكتب
      if (scope.officeId) {
        filter.officeId = scope.officeId;

        filter.lawyers = req.user.id;
      }

      // لو محامي مستقل
      else {
        filter.officeId = null;
        filter.lawyers = req.user.id;
      }
    }

    // ==================================================
    // Admin
    // ==================================================
    // Admin لا يحتاج فلتر officeId

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

/*
|--------------------------------------------------------------------------
| Delete Case
|--------------------------------------------------------------------------
*/

const deleteCase = async (req, res, next) => {
  try {
    const scope = await getUserScope(req);

    const { id } = req.params;

    let filter = {
      _id: id,
    };

    // ==================================================
    // Office Owner
    // ==================================================

    if (req.user.role === "office_owner") {
      filter.officeId = scope.officeId;
    }

    // ==================================================
    // Lawyer
    // ==================================================

    if (req.user.role === "lawyer") {
      filter.lawyers = req.user.id;

      // محامي تابع لمكتب
      if (scope.officeId) {
        filter.officeId = scope.officeId;
      }

      // محامي مستقل
      else {
        filter.officeId = null;
      }
    }

    const deletedCase = await caseModel.findOneAndDelete(
      filter,
    );

    if (!deletedCase) {
      throw new AppError(
        "لم يتم العثور على القضية",
        404,
      );
    }

    res.status(200).json({
      message: "تم حذف القضية بنجاح",
    });
  } catch (e) {
    next(e);
  }
};

/*
|--------------------------------------------------------------------------
| Get Case By ID
|--------------------------------------------------------------------------
*/

const getCaseById = async (req, res, next) => {
  try {
    const scope = await getUserScope(req);

    const { id } = req.params;

    let filter = {
      _id: id,
      isArchived: false,
    };

    // ==================================================
    // Office Owner
    // ==================================================

    if (req.user.role === "office_owner") {
      filter.officeId = scope.officeId;
    }

    // ==================================================
    // Lawyer
    // ==================================================

    if (req.user.role === "lawyer") {
      filter.lawyers = req.user.id;

      if (scope.officeId) {
        filter.officeId = scope.officeId;
      } else {
        filter.officeId = null;
      }
    }

    const caseData = await caseModel
      .findOne(filter)
      .populate("clientId", "name phone")
      .populate("lawyers", "name email")
      .populate("caseTypeId", "name")
      .populate("officeId", "name");

    if (!caseData) {
      throw new AppError(
        "لم يتم العثور على القضية",
        404,
      );
    }

    res.status(200).json({
      caseData,
    });
  } catch (e) {
    next(e);
  }
};

/*
|--------------------------------------------------------------------------
| Update Case
|--------------------------------------------------------------------------
*/

const updateCase = async (req, res, next) => {
  try {
    const scope = await getUserScope(req);

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

    let filter = {
      _id: id,
    };

    // ==================================================
    // Office Owner
    // ==================================================

    if (req.user.role === "office_owner") {
      filter.officeId = scope.officeId;
    }

    // ==================================================
    // Lawyer
    // ==================================================

    if (req.user.role === "lawyer") {
      filter.lawyers = req.user.id;

      if (scope.officeId) {
        filter.officeId = scope.officeId;
      } else {
        filter.officeId = null;
      }
    }

    // ==================================================
    // تحديد المحامين
    // ==================================================

    let updatedLawyers = Array.isArray(lawyers)
      ? lawyers
      : [];

    // المحامي لا يستطيع إزالة نفسه من القضية
    if (req.user.role === "lawyer") {
      updatedLawyers = [req.user.id];
    }

    // ==================================================
    // Update
    // ==================================================

    const updatedCase = await caseModel.findOneAndUpdate(
      filter,
      {
        clientId,
        lawyers: updatedLawyers,
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
      throw new AppError(
        "لم يتم العثور على القضية",
        404,
      );
    }

    // ==================================================
    // Timeline
    // ==================================================

    await createTimeLine({
      officeId: updatedCase.officeId || null,
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

export {
  handleAddCase,
  getCases,
  deleteCase,
  getCaseById,
  updateCase,
};