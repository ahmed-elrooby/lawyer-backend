import Joi from "joi";

const createOfficeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "اسم المكتب مطلوب",
    "string.min": "اسم المكتب يجب أن يكون حرفين على الأقل",
    "string.max": "اسم المكتب يجب ألا يتجاوز 100 حرف",
    "any.required": "اسم المكتب مطلوب",
  }),

  phone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]+$/)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "رقم الهاتف غير صالح",
    }),

  email: Joi.string().trim().lowercase().email().optional().allow("").messages({
    "string.email": "البريد الإلكتروني غير صحيح",
  }),

  address: Joi.string().trim().max(250).optional().allow("").messages({
    "string.max": "العنوان يجب ألا يتجاوز 250 حرف",
  }),

  city: Joi.string().trim().max(100).optional().allow("").messages({
    "string.max": "اسم المدينة يجب ألا يتجاوز 100 حرف",
  }),

  country: Joi.string().trim().max(100).optional().messages({
    "string.max": "اسم الدولة يجب ألا يتجاوز 100 حرف",
  }),
});

const updateOfficeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional().messages({
    "string.min": "اسم المكتب يجب أن يكون حرفين على الأقل",
    "string.max": "اسم المكتب يجب ألا يتجاوز 100 حرف",
  }),

  phone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]+$/)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "رقم الهاتف غير صالح",
    }),

  email: Joi.string().trim().lowercase().email().optional().allow("").messages({
    "string.email": "البريد الإلكتروني غير صحيح",
  }),

  address: Joi.string().trim().max(250).optional().allow("").messages({
    "string.max": "العنوان يجب ألا يتجاوز 250 حرف",
  }),

  city: Joi.string().trim().max(100).optional().allow("").messages({
    "string.max": "اسم المدينة يجب ألا يتجاوز 100 حرف",
  }),

  country: Joi.string().trim().max(100).optional().allow("").messages({
    "string.max": "اسم الدولة يجب ألا يتجاوز 100 حرف",
  }),
});

export { createOfficeSchema, updateOfficeSchema };
