import Joi from "joi";

const createSessionSchema = Joi.object({
  caseId: Joi.string().hex().length(24).required().messages({
    "string.empty": "معرف القضية مطلوب",
    "string.hex": "معرف القضية غير صالح",
    "string.length": "معرف القضية غير صالح",
    "any.required": "معرف القضية مطلوب",
  }),

  title: Joi.string().trim().min(2).max(200).required().messages({
    "string.empty": "عنوان الجلسة مطلوب",
    "string.min": "عنوان الجلسة يجب أن يكون حرفين على الأقل",
    "string.max": "عنوان الجلسة يجب ألا يتجاوز 200 حرف",
    "any.required": "عنوان الجلسة مطلوب",
  }),

  sessionDate: Joi.date().required().messages({
    "date.base": "تاريخ الجلسة غير صالح",
    "any.required": "تاريخ الجلسة مطلوب",
  }),

  sessionTime: Joi.string()
    .trim()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      "string.empty": "وقت الجلسة مطلوب",
      "string.pattern.base": "وقت الجلسة يجب أن يكون بصيغة HH:mm مثل 10:30",
      "any.required": "وقت الجلسة مطلوب",
    }),

  status: Joi.string()
    .valid("scheduled", "attended", "postponed", "completed", "cancelled")
    .optional()
    .messages({
      "any.only": "حالة الجلسة غير صحيحة",
    }),

  notes: Joi.string().trim().max(2000).optional().allow("").messages({
    "string.max": "ملاحظات الجلسة يجب ألا تتجاوز 2000 حرف",
  }),

  decision: Joi.string().trim().max(2000).optional().allow("").messages({
    "string.max": "قرار الجلسة يجب ألا يتجاوز 2000 حرف",
  }),

  nextSessionDate: Joi.date().optional().allow(null, "").messages({
    "date.base": "تاريخ الجلسة القادمة غير صالح",
  }),
});
const updateSessionSchema = Joi.object({
  caseId: Joi.string().hex().length(24).optional().messages({
    "string.hex": "معرف القضية غير صالح",
    "string.length": "معرف القضية غير صالح",
  }),

  title: Joi.string().trim().min(2).max(200).optional().messages({
    "string.min": "عنوان الجلسة يجب أن يكون حرفين على الأقل",
    "string.max": "عنوان الجلسة يجب ألا يتجاوز 200 حرف",
  }),

  sessionDate: Joi.date().optional().messages({
    "date.base": "تاريخ الجلسة غير صالح",
  }),

  sessionTime: Joi.string()
    .trim()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional()
    .messages({
      "string.pattern.base": "وقت الجلسة يجب أن يكون بصيغة HH:mm مثل 10:30",
    }),

  status: Joi.string()
    .valid("scheduled", "attended", "postponed", "completed", "cancelled")
    .optional()
    .messages({
      "any.only": "حالة الجلسة غير صحيحة",
    }),

  notes: Joi.string().trim().max(2000).optional().allow("").messages({
    "string.max": "ملاحظات الجلسة يجب ألا تتجاوز 2000 حرف",
  }),

  decision: Joi.string().trim().max(2000).optional().allow("").messages({
    "string.max": "قرار الجلسة يجب ألا يتجاوز 2000 حرف",
  }),

  nextSessionDate: Joi.date().optional().allow(null, "").messages({
    "date.base": "تاريخ الجلسة القادمة غير صالح",
  }),
});
export { createSessionSchema, updateSessionSchema };
