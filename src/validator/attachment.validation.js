import Joi from "joi";

const createAttachmentSchema = Joi.object({
  caseId: Joi.string().hex().length(24).optional().allow(null, "").messages({
    "string.hex": "معرف القضية غير صالح",
    "string.length": "معرف القضية غير صالح",
  }),

  clientId: Joi.string().hex().length(24).optional().allow(null, "").messages({
    "string.hex": "معرف العميل غير صالح",
    "string.length": "معرف العميل غير صالح",
  }),

  sessionId: Joi.string().hex().length(24).optional().allow(null, "").messages({
    "string.hex": "معرف الجلسة غير صالح",
    "string.length": "معرف الجلسة غير صالح",
  }),

  categoryId: Joi.string().hex().length(24).required().messages({
    "string.empty": "تصنيف الملف مطلوب",
    "string.hex": "معرف تصنيف الملف غير صالح",
    "string.length": "معرف تصنيف الملف غير صالح",
    "any.required": "تصنيف الملف مطلوب",
  }),

  name: Joi.string().trim().min(1).max(200).required().messages({
    "string.empty": "اسم الملف مطلوب",
    "string.min": "اسم الملف مطلوب",
    "string.max": "اسم الملف يجب ألا يتجاوز 200 حرف",
    "any.required": "اسم الملف مطلوب",
  }),

  description: Joi.string().trim().max(1000).optional().allow("").messages({
    "string.max": "وصف الملف يجب ألا يتجاوز 1000 حرف",
  }),
});

const updateAttachmentSchema = Joi.object({
  categoryId: Joi.string().hex().length(24).optional().messages({
    "string.hex": "معرف تصنيف الملف غير صالح",
    "string.length": "معرف تصنيف الملف غير صالح",
  }),

  name: Joi.string().trim().min(1).max(200).optional().messages({
    "string.empty": "اسم الملف مطلوب",
    "string.min": "اسم الملف مطلوب",
    "string.max": "اسم الملف يجب ألا يتجاوز 200 حرف",
  }),

  description: Joi.string().trim().max(1000).optional().allow("").messages({
    "string.max": "وصف الملف يجب ألا يتجاوز 1000 حرف",
  }),

  caseId: Joi.string().hex().length(24).optional().allow(null, "").messages({
    "string.hex": "معرف القضية غير صالح",
    "string.length": "معرف القضية غير صالح",
  }),

  clientId: Joi.string().hex().length(24).optional().allow(null, "").messages({
    "string.hex": "معرف العميل غير صالح",
    "string.length": "معرف العميل غير صالح",
  }),

  sessionId: Joi.string().hex().length(24).optional().allow(null, "").messages({
    "string.hex": "معرف الجلسة غير صالح",
    "string.length": "معرف الجلسة غير صالح",
  }),
});

export { createAttachmentSchema, updateAttachmentSchema };
