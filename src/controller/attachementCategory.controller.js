import AttachmentCategoryModel from "../models/attachmentCategories.model.js";
import AppError from "./../utils/AppError.js";

const addCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw new AppError("اسم القسم مطلوب", 400);
    }

    const existingCategory = await AttachmentCategoryModel.findOne({
      name: name.trim(),
    });

    if (existingCategory) {
      throw new AppError("هذا القسم موجود بالفعل", 409);
    }

    const category = new AttachmentCategoryModel({
      name,
      description,
    });

    await category.save();

    return res.status(201).json({
      message: "تم إنشاء القسم بنجاح",
      category,
    });
  } catch (e) {
    next(e);
  }
};
const getCategories = async (req, res) => {
  try {
    const categories = await AttachmentCategoryModel.find({
      isActive: true,
    });
    return res.status(200).json({
      message: "تم الحصول على الأقسام بنجاح",
      categories,
    });
  } catch (e) {
    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};
const deleteCategory = async (req, res, next) => {
  const { id } = req.params;

  try {
    const category = await AttachmentCategoryModel.findById(id);

    if (!category) {
      throw new AppError("القسم غير موجود", 404);
    }

    if (!category.isActive) {
      throw new AppError("القسم محذوف بالفعل", 400);
    }

    category.isActive = false;

    await category.save();

    return res.status(200).json({
      message: "تم حذف القسم بنجاح",
      category,
    });
  } catch (e) {
    next(e);
  }
};

const updateCategory = async (req, res, next) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const category = await AttachmentCategoryModel.findById(id);

    if (!category) {
      throw new AppError("القسم غير موجود", 404);
    }

    if (!category.isActive) {
      throw new AppError("القسم محذوف بالفعل", 400);
    }

    if (name !== undefined) {
      if (!name.trim()) {
        throw new AppError("اسم القسم مطلوب", 400);
      }

      const existingCategory = await AttachmentCategoryModel.findOne({
        name: name.trim(),
        _id: { $ne: id },
      });

      if (existingCategory) {
        throw new AppError("هذا القسم موجود بالفعل", 409);
      }

      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description;
    }

    await category.save();

    return res.status(200).json({
      message: "تم تحديث القسم بنجاح",
      category,
    });
  } catch (e) {
    next(e);
  }
};
const getCategoryById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const category = await AttachmentCategoryModel.findOne({
      _id: id,
      isActive: true,
    });

    if (!category) {
      throw new AppError("القسم غير موجود", 404);
    }

    return res.status(200).json({
      message: "تم الحصول على القسم بنجاح",
      category,
    });
  } catch (e) {
    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};
export {
  addCategory,
  getCategories,
  deleteCategory,
  updateCategory,
  getCategoryById,
};
