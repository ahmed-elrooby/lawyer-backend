import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import {
  deleteDocument,
  getDocumnts,
  handleAddAttachment,
  updateDocument,
} from "../controller/document.controller.js";
import documentUpload from "../middleware/documentUpload.middleware.js";

const documentRouter = express.Router();
documentRouter
  .route("/document")

  .post(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    documentUpload.single("file"),
    handleAddAttachment,
  )
  .get(authMiddleware, roleMiddleware("office_owner", "lawyer"), getDocumnts);
documentRouter
  .route("/document/:id")
  .get(authMiddleware, roleMiddleware("office_owner", "lawyer"), getDocumnts)
  .delete(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    deleteDocument,
  )
  .put(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    documentUpload.single("file"),
    updateDocument,
  );
export default documentRouter;
