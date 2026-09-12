import Joi from "joi";

const createTimeLineSchema = Joi.object({
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

  attachmentId: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.hex": "معرف المرفق غير صالح",
      "string.length": "معرف المرفق غير صالح",
    }),

  noteId: Joi.string().hex().length(24).optional().allow(null, "").messages({
    "string.hex": "معرف الملاحظة غير صالح",
    "string.length": "معرف الملاحظة غير صالح",
  }),

  type: Joi.string()
    .valid(
      "case_created",
      "case_updated",
      "session_created",
      "session_updated",
      "attachment_uploaded",
      "attachment_deleted",
      "note_created",
      "note_updated",
      "note_deleted",
    )
    .required()
    .messages({
      "any.only": "نوع الـ Timeline غير صحيح",
      "any.required": "نوع الـ Timeline مطلوب",
    }),

  title: Joi.string().trim().min(2).max(200).required().messages({
    "string.empty": "عنوان الـ Timeline مطلوب",
    "string.min": "عنوان الـ Timeline يجب أن يكون حرفين على الأقل",
    "string.max": "عنوان الـ Timeline يجب ألا يتجاوز 200 حرف",
    "any.required": "عنوان الـ Timeline مطلوب",
  }),

  description: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow("")
    .default("")
    .messages({
      "string.max": "وصف الـ Timeline يجب ألا يتجاوز 1000 حرف",
    }),
});

export { createTimeLineSchema };
