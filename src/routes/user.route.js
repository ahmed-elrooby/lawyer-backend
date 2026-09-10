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
const userRoutes = express.Router();
userRoutes
  .route("/users")
  .get(getUsers, authMiddleware, roleMiddleware("admin", "office_owner"))
  .post(
    authMiddleware,
    roleMiddleware("admin", "office_owner"),
    upload.single("profileImage"),
    createUser,
  );
userRoutes
  .route("/users/:id")
  .get(getUserById, authMiddleware, roleMiddleware("admin", "office_owner"))
  .delete(authMiddleware, roleMiddleware("admin", "office_owner"), deleteUser)
  .put(
    authMiddleware,
    roleMiddleware("admin", "office_owner"),
    upload.single("profileImage"),
    updateUser,
  );

export default userRoutes;
