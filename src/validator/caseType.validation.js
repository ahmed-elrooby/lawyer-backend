import Joi from "joi";

const createCaseTypeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "اسم نوع القضية مطلوب",
    "string.min": "اسم نوع القضية يجب أن يكون حرفين على الأقل",
    "string.max": "اسم نوع القضية يجب ألا يتجاوز 100 حرف",
    "any.required": "اسم نوع القضية مطلوب",
  }),

  description: Joi.string().trim().max(1000).optional().allow("").messages({
    "string.max": "وصف نوع القضية يجب ألا يتجاوز 1000 حرف",
  }),
});

const updateCaseTypeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional().messages({
    "string.min": "اسم نوع القضية يجب أن يكون حرفين على الأقل",
    "string.max": "اسم نوع القضية يجب ألا يتجاوز 100 حرف",
  }),

  description: Joi.string().trim().max(1000).optional().allow("").messages({
    "string.max": "وصف نوع القضية يجب ألا يتجاوز 1000 حرف",
  }),

  isActive: Joi.boolean().optional().messages({
    "boolean.base": "حالة نوع القضية غير صحيحة",
  }),
});

export { createCaseTypeSchema, updateCaseTypeSchema };
