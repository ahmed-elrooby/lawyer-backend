import express from "express";
import { login } from "../controller/auth.controller.js";
const authRoutes = express.Router();
authRoutes.post("/login", login);
export default authRoutes;
