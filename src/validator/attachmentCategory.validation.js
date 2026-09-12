import Joi from "joi";

const createAttachmentCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "اسم تصنيف المرفق مطلوب",
    "string.min": "اسم تصنيف المرفق يجب أن يكون حرفين على الأقل",
    "string.max": "اسم تصنيف المرفق يجب ألا يتجاوز 100 حرف",
    "any.required": "اسم تصنيف المرفق مطلوب",
  }),

  description: Joi.string().trim().max(1000).optional().allow("").messages({
    "string.max": "وصف تصنيف المرفق يجب ألا يتجاوز 1000 حرف",
  }),
});

const updateAttachmentCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional().messages({
    "string.min": "اسم تصنيف المرفق يجب أن يكون حرفين على الأقل",
    "string.max": "اسم تصنيف المرفق يجب ألا يتجاوز 100 حرف",
  }),

  description: Joi.string().trim().max(1000).optional().allow("").messages({
    "string.max": "وصف تصنيف المرفق يجب ألا يتجاوز 1000 حرف",
  }),

  isActive: Joi.boolean().optional().messages({
    "boolean.base": "حالة تصنيف المرفق غير صحيحة",
  }),
});

export { createAttachmentCategorySchema, updateAttachmentCategorySchema };
