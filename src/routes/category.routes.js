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
  .get(
    authMiddleware,
    roleMiddleware("admin", "office_owner", "lawyer"),
    getCategories,
  )
  .post(
    authMiddleware,
    roleMiddleware("admin"),
    validate(createAttachmentCategorySchema),
    addCategory,
  );
categoryRouter
  .route("/category/:id")
  .get(
    authMiddleware,
    roleMiddleware("admin", "office_owner", "lawyer"),
    getCategoryById,
  )
  .delete(authMiddleware, roleMiddleware("admin"), deleteCategory)
  .put(
    authMiddleware,
    roleMiddleware("admin"),
    validate(updateAttachmentCategorySchema),
    updateCategory,
  );
export default categoryRouter;
