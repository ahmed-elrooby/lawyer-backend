import express from "express";
import {
  createLawyer,
  deleteLawyer,
  getLawyerById,
  getLawyers,
  updateLawyer,
} from "../controller/lawyer.controller.js";
import authMiddleware from "./../middleware/auth.middleware.js";
import roleMiddleware from "./../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";
const lawyerRoutes = express.Router();

lawyerRoutes
  .route("/lawyer")
  .post(
    authMiddleware,
    roleMiddleware("admin", "office_owner"),
    upload.single("profileImage"),
   
    createLawyer,
  )
  .get(authMiddleware, roleMiddleware("admin", "office_owner"), getLawyers);
lawyerRoutes
  .route("/lawyer/:id")
  .delete(authMiddleware, roleMiddleware("admin", "office_owner"), deleteLawyer)
  .put(
    authMiddleware,
    roleMiddleware("admin", "office_owner"),
    upload.single("profileImage"),
    updateLawyer,
  )
  .get(authMiddleware, getLawyerById);

export default lawyerRoutes;
