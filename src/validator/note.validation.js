
import Joi from "joi";

// ==========================================
// Create Note
// ==========================================

const createNoteSchema = Joi.object({
  caseId: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.hex": "معرف القضية غير صالح",
      "string.length": "معرف القضية غير صالح",
    }),

  clientId: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.hex": "معرف العميل غير صالح",
      "string.length": "معرف العميل غير صالح",
    }),

  sessionId: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.hex": "معرف الجلسة غير صالح",
      "string.length": "معرف الجلسة غير صالح",
    }),

  content: Joi.string()
    .trim()
    .min(1)
    .max(5000)
    .required()
    .messages({
      "string.empty": "محتوى الملاحظة مطلوب",
      "string.min": "محتوى الملاحظة مطلوب",
      "string.max": "الملاحظة يجب ألا تتجاوز 5000 حرف",
      "any.required": "محتوى الملاحظة مطلوب",
    }),
});

// ==========================================
// Update Note
// ==========================================

const updateNoteSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(1)
    .max(5000)
    .required()
    .messages({
      "string.empty": "محتوى الملاحظة مطلوب",
      "string.min": "محتوى الملاحظة مطلوب",
      "string.max": "الملاحظة يجب ألا تتجاوز 5000 حرف",
      "any.required": "محتوى الملاحظة مطلوب",
    }),
});

export {
  createNoteSchema,
  updateNoteSchema,
};
