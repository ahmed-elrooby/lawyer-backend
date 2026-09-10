import express from "express";
import authMiddleware from "./../middleware/auth.middleware.js";
import roleMiddleware from "./../middleware/role.middleware.js";
import { getTimeLine } from "../controller/timeLine.controller.js";

const timeLineRouter = express.Router();

timeLineRouter.get(
  "/timeline",
  authMiddleware,
  roleMiddleware("office_owner", "lawyer", "admin"),
  getTimeLine,
);

export default timeLineRouter;
