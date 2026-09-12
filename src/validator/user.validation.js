import Joi from "joi";

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(3).max(50).required().messages({
    "string.empty": "الاسم مطلوب",
    "string.min": "الاسم يجب أن يكون 3 أحرف على الأقل",
    "string.max": "الاسم يجب ألا يتجاوز 50 حرف",
    "any.required": "الاسم مطلوب",
  }),

  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "البريد الإلكتروني مطلوب",
    "string.email": "البريد الإلكتروني غير صحيح",
    "any.required": "البريد الإلكتروني مطلوب",
  }),

  password: Joi.string().min(6).required().messages({
    "string.empty": "كلمة المرور مطلوبة",
    "string.min": "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
    "any.required": "كلمة المرور مطلوبة",
  }),

  phone: Joi.string().trim().optional().allow("").messages({
    "string.base": "رقم الهاتف يجب أن يكون نصًا",
  }),

  role: Joi.string()
    .valid("admin", "office_owner", "lawyer")
    .optional()
    .messages({
      "any.only": "نوع المستخدم غير صحيح",
    }),
});
const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(3).max(50).optional().messages({
    "string.min": "الاسم يجب أن يكون 3 أحرف على الأقل",
    "string.max": "الاسم يجب ألا يتجاوز 50 حرف",
  }),

  email: Joi.string().trim().lowercase().email().optional().messages({
    "string.email": "البريد الإلكتروني غير صحيح",
  }),

  phone: Joi.string().trim().optional().allow(""),
});
export { createUserSchema, updateUserSchema };
