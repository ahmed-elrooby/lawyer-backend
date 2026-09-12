import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

import {
  deleteSession,
  getSessionById,
  getSessions,
  handleAddSession,
  updateSession,
} from "../controller/session.controller.js";
import validate from "../middleware/validate.js";
import {
  createSessionSchema,
  updateSessionSchema,
} from "../validator/session.validation.js";

const sessionRouter = express.Router();

sessionRouter
  .route("/session")
  .post(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    validate(createSessionSchema),
    handleAddSession,
  )
  .get(authMiddleware, roleMiddleware("office_owner", "lawyer"), getSessions);

sessionRouter
  .route("/session/:id")
  .get(authMiddleware, roleMiddleware("office_owner", "lawyer"), getSessionById)
  .put(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    validate(updateSessionSchema),
    updateSession,
  )
  .delete(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    deleteSession,
  );

export default sessionRouter;
