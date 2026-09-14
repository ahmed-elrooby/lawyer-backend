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
    roleMiddleware("office_owner", "lawyer"),
    validate(createCaseTypeSchema),
    addCaseType,
  )
  .get(authMiddleware, roleMiddleware("office_owner", "lawyer"), getCaseType);

caseTypeRouter
  .route("/caseType/:id")
  .get(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    getCaseTypeById,
  )
  .put(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    validate(updateCaseTypeSchema),
    handleUpdateCaseType,
  )
  .delete(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    deleteCaseType,
  );

export default caseTypeRouter;
