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
import validate from "../middleware/validate.js";
import {
  createClientSchema,
  updateClientSchema,
} from "../validator/client.validation.js";

const clientRouter = express.Router();

clientRouter
  .route("/clients")
  .post(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    validate(createClientSchema),
    createClient,
  )
  .get(authMiddleware, roleMiddleware("lawyer", "office_owner"), getAllClients);

clientRouter
  .route("/clients/:id")
  .delete(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    deleteClient,
  )
  .get(authMiddleware, roleMiddleware("office_owner", "lawyer"), getClientById)

  .put(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    validate(updateClientSchema),
    updateClient,
  );

export default clientRouter;
