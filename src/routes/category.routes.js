import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

import {
  addCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from "../controller/attachementCategory.controller.js";

import {
  createAttachmentCategorySchema,
  updateAttachmentCategorySchema,
} from "../validator/attachmentCategory.validation.js";

import validate from "../middleware/validate.js";

const categoryRouter = express.Router();

categoryRouter
  .route("/category")
  .get(authMiddleware, roleMiddleware("office_owner", "lawyer"), getCategories)
  .post(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    validate(createAttachmentCategorySchema),
    addCategory,
  );

categoryRouter
  .route("/category/:id")
  .get(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    getCategoryById,
  )
  .put(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    validate(updateAttachmentCategorySchema),
    updateCategory,
  )
  .delete(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    deleteCategory,
  );

export default categoryRouter;
