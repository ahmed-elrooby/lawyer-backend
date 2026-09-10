import CaseTypeModel from "../models/caseType.model.js";

const addCaseType = async (req, res) => {
  try {
    const { name, description } = req.body;
    const caseType = new CaseTypeModel({ name, description });
    await caseType.save();
    res.status(201).json({ message: "تم إنشاء نوع القضية بنجاح", caseType });
  } catch (e) {
    res.status(500).json({
      message: "حدث خطاء في السيرفر",
      error: e.message,
    });
  }
};
const getCaseType = async (req, res) => {
  try {
    const caseType = await CaseTypeModel.find({});
    res.status(200).json({ caseType });
  } catch (e) {
    res.status(500).send(e);
  }
};
const deleteCaseType = async (req, res) => {
  const { id } = req.params;

  try {
    const caseType = await CaseTypeModel.findById(id);

    if (!caseType) {
      return res.status(404).json({
        message: "نوع القضية غير موجود",
      });
    }

    await CaseTypeModel.findByIdAndDelete(id);

    res.status(200).json({
      message: "تم حذف نوع القضية بنجاح",
      caseType,
    });
  } catch (e) {
    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};
const handleUpdateCaseType = async (req, res) => {
  const { id } = req.params;
  try {
    const caseType = await CaseTypeModel.findById(id);
    if (!caseType) {
      return res.status(404).json({
        message: "نوع القضية غير موجود",
      });
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
    res.status(500).json({
      message: "حدث خطاء في السيرفر",
      error: e.message,
    });
  }
};
const getCaseTypeById = async (req, res) => {
  const { id } = req.params;
  try {
    const caseType = await CaseTypeModel.findById(id);
    if (!caseType) {
      return res.status(404).json({
        message: "نوع القضية غير موجود",
      });
    }
    res.status(200).json({
      caseType,
    });
  } catch (e) {
    res.status(500).json({
      message: "حدث خطاء في السيرفر",
      error: e.message,
    });
  }
};

export {
  addCaseType,
  getCaseType,
  deleteCaseType,
  handleUpdateCaseType,
  getCaseTypeById,
};
