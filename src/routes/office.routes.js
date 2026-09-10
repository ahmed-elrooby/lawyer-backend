import express from "express";

import {
  CreateOffice,
  deleteOffice,
  getOffice,
  getOfficeById,
  updateOffice,
} from "../controller/office.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

const officeRoutes = express.Router();

officeRoutes
  .route("/offices")
  .post(authMiddleware, roleMiddleware("office_owner"), CreateOffice)
  .get(authMiddleware, getOffice);

officeRoutes
  .route("/offices/:id")
  .delete(authMiddleware, roleMiddleware("admin", "office_owner"), deleteOffice)
  .put(authMiddleware, roleMiddleware("admin", "office_owner"), updateOffice)
  .get(authMiddleware, getOfficeById);

export default officeRoutes;
