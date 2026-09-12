import express from "express";

import {
  forgotPassword,
  getProfile,
  login,
  logout,
  resetPassword,
} from "../controller/auth.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "../validator/auth.validation.js";

const authRoutes = express.Router();

authRoutes.post("/login", validate(loginSchema), login);

authRoutes.get("/profile", authMiddleware, getProfile);
authRoutes.post("/logout", authMiddleware, logout);
authRoutes.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPassword,
);
authRoutes.post(
  "/reset-password/:token",
  validate(resetPasswordSchema),
  resetPassword,
);
export default authRoutes;
