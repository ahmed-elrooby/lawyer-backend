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

const caseRouter = express.Router();

caseRouter
  .route("/case")
  .get(authMiddleware, roleMiddleware("office_owner", "lawyer"), getCases)
  .post(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    handleAddCase,
  );

caseRouter
  .route("/case/:id")
  .delete(authMiddleware, roleMiddleware("office_owner", "lawyer"), deleteCase)
  .get(authMiddleware, roleMiddleware("office_owner", "lawyer"), getCaseById)
  .put(authMiddleware, roleMiddleware("office_owner", "lawyer"), updateCase);

export default caseRouter;
