import express from "express";
import {
  createClient,
  deleteClient,
  getAllClients,
  getClientById,
  updateClient,
} from "../controller/clients.controller.js";
import authMiddleware from "./../middleware/auth.middleware.js";
import roleMiddleware from "./../middleware/role.middleware.js";

const clientRouter = express.Router();

clientRouter
  .route("/clients")
  .post(authMiddleware, roleMiddleware("office_owner", "lawyer"), createClient)
  .get(authMiddleware, roleMiddleware("lawyer", "office_owner"), getAllClients);

clientRouter
  .route("/clients/:id")
  .delete(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    deleteClient,
  )
  .get(authMiddleware, roleMiddleware("office_owner", "lawyer"), getClientById)

  .put(authMiddleware, roleMiddleware("office_owner", "lawyer"), updateClient);

export default clientRouter;
