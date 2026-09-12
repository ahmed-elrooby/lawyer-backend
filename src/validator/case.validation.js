import Joi from "joi";

const objectId = Joi.string().hex().length(24);

const createCaseSchema = Joi.object({
  clientId: objectId.required().messages({
    "string.empty": "معرف العميل مطلوب",
    "string.hex": "معرف العميل غير صالح",
    "string.length": "معرف العميل غير صالح",
    "any.required": "معرف العميل مطلوب",
  }),

  lawyers: Joi.array()
    .items(
      objectId.messages({
        "string.hex": "معرف المحامي غير صالح",
        "string.length": "معرف المحامي غير صالح",
      }),
    )
    .optional()
    .default([])
    .messages({
      "array.base": "المحامون يجب أن يكونوا في صورة قائمة",
    }),

  caseTypeId: objectId.required().messages({
    "string.empty": "نوع القضية مطلوب",
    "string.hex": "معرف نوع القضية غير صالح",
    "string.length": "معرف نوع القضية غير صالح",
    "any.required": "نوع القضية مطلوب",
  }),

  caseNumber: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "رقم القضية مطلوب",
    "string.min": "رقم القضية مطلوب",
    "string.max": "رقم القضية يجب ألا يتجاوز 100 حرف",
    "any.required": "رقم القضية مطلوب",
  }),

  title: Joi.string().trim().min(2).max(200).required().messages({
    "string.empty": "عنوان القضية مطلوب",
    "string.min": "عنوان القضية يجب أن يكون حرفين على الأقل",
    "string.max": "عنوان القضية يجب ألا يتجاوز 200 حرف",
    "any.required": "عنوان القضية مطلوب",
  }),

  court: Joi.string().trim().min(2).max(200).required().messages({
    "string.empty": "اسم المحكمة مطلوب",
    "string.min": "اسم المحكمة يجب أن يكون حرفين على الأقل",
    "string.max": "اسم المحكمة يجب ألا يتجاوز 200 حرف",
    "any.required": "اسم المحكمة مطلوب",
  }),

  status: Joi.string()
    .valid("active", "reserved_for_judgment", "judged")
    .optional()
    .messages({
      "any.only": "حالة القضية غير صحيحة",
    }),

  filingDate: Joi.date().required().messages({
    "date.base": "تاريخ رفع القضية غير صالح",
    "any.required": "تاريخ رفع القضية مطلوب",
  }),

  nextHearingDate: Joi.date().optional().allow(null, "").messages({
    "date.base": "تاريخ الجلسة القادمة غير صالح",
  }),

  description: Joi.string().trim().max(5000).optional().allow("").messages({
    "string.max": "وصف القضية يجب ألا يتجاوز 5000 حرف",
  }),

  notes: Joi.string().trim().max(5000).optional().allow("").messages({
    "string.max": "ملاحظات القضية يجب ألا تتجاوز 5000 حرف",
  }),
});

const updateCaseSchema = Joi.object({
  clientId: objectId.optional().messages({
    "string.hex": "معرف العميل غير صالح",
    "string.length": "معرف العميل غير صالح",
  }),

  lawyers: Joi.array()
    .items(
      objectId.messages({
        "string.hex": "معرف المحامي غير صالح",
        "string.length": "معرف المحامي غير صالح",
      }),
    )
    .optional()
    .messages({
      "array.base": "المحامون يجب أن يكونوا في صورة قائمة",
    }),

  caseTypeId: objectId.optional().messages({
    "string.hex": "معرف نوع القضية غير صالح",
    "string.length": "معرف نوع القضية غير صالح",
  }),

  caseNumber: Joi.string().trim().min(1).max(100).optional().messages({
    "string.min": "رقم القضية مطلوب",
    "string.max": "رقم القضية يجب ألا يتجاوز 100 حرف",
  }),

  title: Joi.string().trim().min(2).max(200).optional().messages({
    "string.min": "عنوان القضية يجب أن يكون حرفين على الأقل",
    "string.max": "عنوان القضية يجب ألا يتجاوز 200 حرف",
  }),

  court: Joi.string().trim().min(2).max(200).optional().messages({
    "string.min": "اسم المحكمة يجب أن يكون حرفين على الأقل",
    "string.max": "اسم المحكمة يجب ألا يتجاوز 200 حرف",
  }),

  status: Joi.string()
    .valid("active", "reserved_for_judgment", "judged")
    .optional()
    .messages({
      "any.only": "حالة القضية غير صحيحة",
    }),

  filingDate: Joi.date().optional().messages({
    "date.base": "تاريخ رفع القضية غير صالح",
  }),

  nextHearingDate: Joi.date().optional().allow(null, "").messages({
    "date.base": "تاريخ الجلسة القادمة غير صالح",
  }),

  description: Joi.string().trim().max(5000).optional().allow("").messages({
    "string.max": "وصف القضية يجب ألا يتجاوز 5000 حرف",
  }),

  notes: Joi.string().trim().max(5000).optional().allow("").messages({
    "string.max": "ملاحظات القضية يجب ألا تتجاوز 5000 حرف",
  }),

  isArchived: Joi.boolean().optional().messages({
    "boolean.base": "حالة أرشفة القضية غير صحيحة",
  }),
});

export { createCaseSchema, updateCaseSchema };
