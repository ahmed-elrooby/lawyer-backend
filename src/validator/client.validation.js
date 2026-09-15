import Joi from "joi";

const createClientSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "اسم العميل مطلوب",
    "string.min": "اسم العميل يجب أن يكون حرفين على الأقل",
    "string.max": "اسم العميل يجب ألا يتجاوز 100 حرف",
    "any.required": "اسم العميل مطلوب",
  }),

  email: Joi.string().trim().lowercase().email().optional().allow("").messages({
    "string.email": "البريد الإلكتروني غير صحيح",
  }),

  phone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]+$/)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "رقم الهاتف غير صالح",
    }),

  address: Joi.string().trim().max(250).optional().allow("").messages({
    "string.max": "العنوان يجب ألا يتجاوز 250 حرف",
  }),

  city: Joi.string().trim().max(100).optional().allow("").messages({
    "string.max": "اسم المدينة يجب ألا يتجاوز 100 حرف",
  }),

 country: Joi.string()
  .trim()
  .max(100)
  .optional()
  .allow("")
  .messages({
    "string.max": "اسم الدولة يجب ألا يتجاوز 100 حرف",
  }),

  nationalId: Joi.string()
    .trim()
    .pattern(/^\d{14}$/)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "الرقم القومي يجب أن يتكون من 14 رقم",
    }),

  notes: Joi.string().trim().max(2000).optional().allow("").messages({
    "string.max": "ملاحظات العميل يجب ألا تتجاوز 2000 حرف",
  }),
});

const updateClientSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional().messages({
    "string.min": "اسم العميل يجب أن يكون حرفين على الأقل",
    "string.max": "اسم العميل يجب ألا يتجاوز 100 حرف",
  }),

  email: Joi.string().trim().lowercase().email().optional().allow("").messages({
    "string.email": "البريد الإلكتروني غير صحيح",
  }),

  phone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]+$/)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "رقم الهاتف غير صالح",
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

  nationalId: Joi.string()
    .trim()
    .pattern(/^\d{14}$/)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "الرقم القومي يجب أن يتكون من 14 رقم",
    }),

  notes: Joi.string().trim().max(2000).optional().allow("").messages({
    "string.max": "ملاحظات العميل يجب ألا تتجاوز 2000 حرف",
  }),

  isActive: Joi.boolean().optional().messages({
    "boolean.base": "حالة العميل غير صحيحة",
  }),
});

export { createClientSchema, updateClientSchema };
