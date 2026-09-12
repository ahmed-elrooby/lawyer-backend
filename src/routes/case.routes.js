import express from "express";
import {
  deleteCase,
  getCaseById,
  getCases,
  handleAddCase,
  updateCase,
} from "../controller/case.controller.js";
import roleMiddleware from "../middleware/role.middleware.js";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  createCaseSchema,
  updateCaseSchema,
} from "../validator/case.validation.js";
import validate from "../middleware/validate.js";

const caseRouter = express.Router();

caseRouter
  .route("/case")
  .get(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer", "admin"),
    getCases,
  )
  .post(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    validate(createCaseSchema),
    handleAddCase,
  );

caseRouter
  .route("/case/:id")
  .delete(authMiddleware, roleMiddleware("office_owner", "lawyer"), deleteCase)
  .get(authMiddleware, roleMiddleware("office_owner", "lawyer"), getCaseById)
  .put(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    validate(updateCaseSchema),
    updateCase,
  );

export default caseRouter;
