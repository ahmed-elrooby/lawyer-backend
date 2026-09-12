import express from "express";

import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../controller/user.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";

import {
  createUserSchema,
  updateUserSchema,
} from "../validations/user.validation.js";
import validate from "../middleware/validate.js";

const userRoutes = express.Router();

userRoutes
  .route("/users")
  .get(authMiddleware, roleMiddleware("admin", "office_owner"), getUsers)
  .post(
    authMiddleware,
    roleMiddleware("admin", "office_owner"),
    upload.single("profileImage"),
    validate(createUserSchema),
    createUser,
  );

userRoutes
  .route("/users/:id")
  .get(authMiddleware, roleMiddleware("admin", "office_owner"), getUserById)
  .delete(authMiddleware, roleMiddleware("admin", "office_owner"), deleteUser)
  .put(
    authMiddleware,
    roleMiddleware("admin", "office_owner"),
    upload.single("profileImage"),
    validate(updateUserSchema),
    updateUser,
  );

export default userRoutes;
