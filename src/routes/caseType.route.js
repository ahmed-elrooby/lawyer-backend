import express from "express";
import {
  addCaseType,
  deleteCaseType,
  getCaseType,
  getCaseTypeById,
  handleUpdateCaseType,
} from "../controller/caseType.controller.js";
import roleMiddleware from "./../middleware/role.middleware.js";
import authMiddleware from "./../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";
import {
  createCaseTypeSchema,
  updateCaseTypeSchema,
} from "../validator/caseType.validation.js";
const caseTypeRouter = express.Router();
caseTypeRouter
  .route("/caseType")
  .post(
    authMiddleware,
    roleMiddleware("admin"),
    validate(createCaseTypeSchema),
    addCaseType,
  )
  .get(
    authMiddleware,
    roleMiddleware("admin", "office_owner", "lawyer"),
    getCaseType,
  );
caseTypeRouter
  .route("/caseType/:id")
  .delete(authMiddleware, roleMiddleware("admin"), deleteCaseType)
  .put(
    authMiddleware,
    roleMiddleware("admin"),
    validate(updateCaseTypeSchema),
    handleUpdateCaseType,
  )
  .get(
    authMiddleware,
    roleMiddleware("admin", "office_owner", "lawyer"),
    getCaseTypeById,
  );
export default caseTypeRouter;
