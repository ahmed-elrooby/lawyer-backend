import express from "express";

import {
  forgotPassword,
  getProfile,
  login,
  logout,
  resetPassword,
} from "../controller/auth.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const authRoutes = express.Router();

authRoutes.post("/login", login);

authRoutes.get("/profile", authMiddleware, getProfile);
authRoutes.post("/logout", authMiddleware, logout);
authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/reset-password/:token", resetPassword);
export default authRoutes;
