import AttachmentCategoryModel from "../models/attachmentCategories.model.js";

const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "اسم القسم مطلوب",
      });
    }

    const existingCategory = await AttachmentCategoryModel.findOne({
      name: name.trim(),
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "هذا القسم موجود بالفعل",
      });
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
    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
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
const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await AttachmentCategoryModel.findById(id);

    if (!category) {
      return res.status(404).json({
        message: "القسم غير موجود",
      });
    }

    if (!category.isActive) {
      return res.status(400).json({
        message: "القسم محذوف بالفعل",
      });
    }

    category.isActive = false;

    await category.save();

    return res.status(200).json({
      message: "تم حذف القسم بنجاح",
      category,
    });
  } catch (e) {
    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const category = await AttachmentCategoryModel.findById(id);

    if (!category) {
      return res.status(404).json({
        message: "القسم غير موجود",
      });
    }

    if (!category.isActive) {
      return res.status(400).json({
        message: "القسم محذوف بالفعل",
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message: "اسم القسم مطلوب",
        });
      }

      const existingCategory = await AttachmentCategoryModel.findOne({
        name: name.trim(),
        _id: { $ne: id },
      });

      if (existingCategory) {
        return res.status(409).json({
          message: "هذا القسم موجود بالفعل",
        });
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
    return res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: e.message,
    });
  }
};
const getCategoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await AttachmentCategoryModel.findOne({
      _id: id,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        message: "القسم غير موجود",
      });
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
