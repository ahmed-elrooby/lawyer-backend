import mongoose from "mongoose";

import AttachmentCategoryModel from "../models/attachmentCategories.model.js";
import AppError from "./../utils/AppError.js";
import getCaseTypeOwner from "../utils/caseTypeOwner.js";

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

// إضافة تصنيف
const addCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      throw new AppError("اسم القسم مطلوب", 400);
    }

    const owner = await getCaseTypeOwner(req.user.id);

    const ownerFilter = getOwnerFilter(owner);

    const existingCategory = await AttachmentCategoryModel.findOne({
      ...ownerFilter,
      name: name.trim(),
    });

    if (existingCategory) {
      throw new AppError("هذا القسم موجود بالفعل", 409);
    }

    const category = new AttachmentCategoryModel({
      name: name.trim(),
      description: description?.trim() || "",
      ownerType: owner.ownerType,
      officeId: owner.officeId,
      lawyerId: owner.lawyerId,
      createdBy: req.user.id,
    });

    await category.save();

    return res.status(201).json({
      message: "تم إنشاء القسم بنجاح",
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("هذا القسم موجود بالفعل", 409));
    }

    next(error);
  }
};

// جلب الأقسام
const getCategories = async (req, res, next) => {
  try {
    const owner = await getCaseTypeOwner(req.user.id);

    const ownerFilter = getOwnerFilter(owner);

    const categories = await AttachmentCategoryModel.find({
      ...ownerFilter,
      isActive: true,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      message: "تم الحصول على الأقسام بنجاح",
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// حذف القسم - Soft Delete
const deleteCategory = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError("معرف القسم غير صالح", 400);
    }

    const owner = await getCaseTypeOwner(req.user.id);

    const ownerFilter = getOwnerFilter(owner);

    const category = await AttachmentCategoryModel.findOne({
      _id: id,
      ...ownerFilter,
    });

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
  } catch (error) {
    next(error);
  }
};

// تعديل القسم
const updateCategory = async (req, res, next) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;

  try {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError("معرف القسم غير صالح", 400);
    }

    const owner = await getCaseTypeOwner(req.user.id);

    const ownerFilter = getOwnerFilter(owner);

    const category = await AttachmentCategoryModel.findOne({
      _id: id,
      ...ownerFilter,
    });

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

      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    await category.save();

    return res.status(200).json({
      message: "تم تحديث القسم بنجاح",
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("هذا القسم موجود بالفعل", 409));
    }

    next(error);
  }
};

// جلب قسم واحد
const getCategoryById = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError("معرف القسم غير صالح", 400);
    }

    const owner = await getCaseTypeOwner(req.user.id);

    const ownerFilter = getOwnerFilter(owner);

    const category = await AttachmentCategoryModel.findOne({
      _id: id,
      ...ownerFilter,
      isActive: true,
    });

    if (!category) {
      throw new AppError("القسم غير موجود", 404);
    }

    return res.status(200).json({
      message: "تم الحصول على القسم بنجاح",
      category,
    });
  } catch (error) {
    next(error);
  }
};

export {
  addCategory,
  getCategories,
  deleteCategory,
  updateCategory,
  getCategoryById,
};
