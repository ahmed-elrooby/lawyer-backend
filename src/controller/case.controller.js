import caseModel from "../models/case.model.js";
import officeModel from "../models/office.model.js";
import UserModel from "../models/User.model.js";
import createTimeLine from "../services/timeline.service.js";

const handleAddCase = async (req, res) => {
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

    // لو Role غير مسموح
    if (!officeId) {
      return res.status(403).json({
        message: "غير مسموح لك بإنشاء قضية",
      });
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
    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};
const getCases = async (req, res) => {
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
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
      }

      filter.officeId = office._id;
    }

    // المحامي
    if (req.user.role === "lawyer") {
      const lawyer = await UserModel.findById(req.user.id).select("officeId");

      if (!lawyer || !lawyer.officeId) {
        return res.status(404).json({
          message: "لم يتم العثور على المكتب",
        });
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
    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};
const deleteCase = async (req, res) => {
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

    // التأكد من الصلاحية
    if (!officeId) {
      return res.status(403).json({
        message: "غير مسموح لك بحذف القضية",
      });
    }

    const { id } = req.params;

    // حذف القضية بشرط تكون تابعة لنفس المكتب
    const deletedCase = await caseModel.findOneAndDelete({
      _id: id,
      officeId: officeId,
    });

    if (!deletedCase) {
      return res.status(404).json({
        message: "لم يتم العثور على القضية",
      });
    }

    res.status(200).json({
      message: "تم حذف القضية بنجاح",
    });
  } catch (e) {
    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};
const getCaseById = async (req, res) => {
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

    // التأكد من الصلاحية
    if (!officeId) {
      return res.status(403).json({
        message: "غير مسموح لك بعرض القضية",
      });
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
      return res.status(404).json({
        message: "لم يتم العثور على القضية",
      });
    }

    res.status(200).json({
      caseData,
    });
  } catch (e) {
    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};
const updateCase = async (req, res) => {
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

    // التأكد من الصلاحية
    if (!officeId) {
      return res.status(403).json({
        message: "غير مسموح لك بتعديل القضية",
      });
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
      return res.status(404).json({
        message: "لم يتم العثور على القضية",
      });
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
    console.error("Update Case Error:", e);

    if (e.name === "CastError") {
      return res.status(400).json({
        message: "يوجد ID غير صالح",
      });
    }

    if (e.name === "ValidationError") {
      return res.status(400).json({
        message: "بيانات القضية غير صحيحة",
        error: e.message,
      });
    }

    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};
export { handleAddCase, getCases, deleteCase, getCaseById, updateCase };
