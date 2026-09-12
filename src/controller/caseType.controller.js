import CaseTypeModel from "../models/caseType.model.js";
import AppError from "../utils/AppError.js";

const addCaseType = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const caseType = new CaseTypeModel({ name, description });
    await caseType.save();
    res.status(201).json({ message: "تم إنشاء نوع القضية بنجاح", caseType });
  } catch (e) {
    next(e);
  }
};
const getCaseType = async (req, res, next) => {
  try {
    const caseType = await CaseTypeModel.find({});
    res.status(200).json({ caseType });
  } catch (e) {
    next(e);
  }
};
const deleteCaseType = async (req, res, next) => {
  const { id } = req.params;

  try {
    const caseType = await CaseTypeModel.findById(id);

    if (!caseType) {
      throw new AppError("نوع القضية غير موجود", 404);
    }

    await CaseTypeModel.findByIdAndDelete(id);

    res.status(200).json({
      message: "تم حذف نوع القضية بنجاح",
      caseType,
    });
  } catch (e) {
    next(e);
  }
};
const handleUpdateCaseType = async (req, res, next) => {
  const { id } = req.params;
  try {
    const caseType = await CaseTypeModel.findById(id);
    if (!caseType) {
      throw new AppError("نوع القضية غير موجود", 404);
    }
    const { name, description } = req.body;
    caseType.name = name ?? caseType.name;
    caseType.description = description ?? caseType.description;
    await caseType.save();
    res.status(200).json({
      message: "تم تحديث نوع القضية بنجاح",
      caseType,
    });
  } catch (e) {
    next(e);
  }
};
const getCaseTypeById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const caseType = await CaseTypeModel.findById(id);
    if (!caseType) {
      throw new AppError("نوع القضية غير موجود", 404);
    }
    res.status(200).json({
      caseType,
    });
  } catch (e) {
    next(e);
  }
};

export {
  addCaseType,
  getCaseType,
  deleteCaseType,
  handleUpdateCaseType,
  getCaseTypeById,
};
