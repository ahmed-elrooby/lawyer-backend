import CaseTypeModel from "../models/caseType.model.js";
import AppError from "../utils/AppError.js";
import getCaseTypeOwner from "../utils/caseTypeOwner.js";
import mongoose from "mongoose";

const getOwnerFilter = (owner) => {
  if (owner.ownerType === "office") {
    return {
      ownerType: "office",
      officeId: owner.officeId,
    };
  }

  return {
    ownerType: "lawyer",
    lawyerId: owner.lawyerId,
  };
};

const addCaseType = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const owner = await getCaseTypeOwner(req.user.id);

    const caseType = new CaseTypeModel({
      name,
      description,
      ownerType: owner.ownerType,
      officeId: owner.officeId,
      lawyerId: owner.lawyerId,
      createdBy: req.user.id,
    });

    await caseType.save();

    res.status(201).json({
      message: "تم إنشاء نوع القضية بنجاح",
      caseType,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("نوع القضية بهذا الاسم موجود بالفعل", 409));
    }

    next(error);
  }
};

const getCaseType = async (req, res, next) => {
  try {
    const owner = await getCaseTypeOwner(req.user.id);

    const ownerFilter = getOwnerFilter(owner);

    const caseType = await CaseTypeModel.find(ownerFilter).sort({
      createdAt: -1,
    });

    res.status(200).json({
      caseType,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCaseType = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError("معرف نوع القضية غير صالح", 400);
    }

    const owner = await getCaseTypeOwner(req.user.id);

    const ownerFilter = getOwnerFilter(owner);

    const caseType = await CaseTypeModel.findOneAndDelete({
      _id: id,
      ...ownerFilter,
    });

    if (!caseType) {
      throw new AppError("نوع القضية غير موجود", 404);
    }

    res.status(200).json({
      message: "تم حذف نوع القضية بنجاح",
      caseType,
    });
  } catch (error) {
    next(error);
  }
};

const handleUpdateCaseType = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError("معرف نوع القضية غير صالح", 400);
    }

    const owner = await getCaseTypeOwner(req.user.id);

    const ownerFilter = getOwnerFilter(owner);

    const caseType = await CaseTypeModel.findOne({
      _id: id,
      ...ownerFilter,
    });

    if (!caseType) {
      throw new AppError("نوع القضية غير موجود", 404);
    }

    const { name, description, isActive } = req.body;

    caseType.name = name ?? caseType.name;
    caseType.description = description ?? caseType.description;

    if (isActive !== undefined) {
      caseType.isActive = isActive;
    }

    await caseType.save();

    res.status(200).json({
      message: "تم تحديث نوع القضية بنجاح",
      caseType,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("نوع القضية بهذا الاسم موجود بالفعل", 409));
    }

    next(error);
  }
};

const getCaseTypeById = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError("معرف نوع القضية غير صالح", 400);
    }

    const owner = await getCaseTypeOwner(req.user.id);

    const ownerFilter = getOwnerFilter(owner);

    const caseType = await CaseTypeModel.findOne({
      _id: id,
      ...ownerFilter,
    });

    if (!caseType) {
      throw new AppError("نوع القضية غير موجود", 404);
    }

    res.status(200).json({
      caseType,
    });
  } catch (error) {
    next(error);
  }
};

export {
  addCaseType,
  getCaseType,
  deleteCaseType,
  handleUpdateCaseType,
  getCaseTypeById,
};
