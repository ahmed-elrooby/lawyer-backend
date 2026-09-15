import express from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

import {
  deleteDocument,
  getDocumnts,
  getDocumentById,
  handleAddAttachment,
  updateDocument,
} from "../controller/document.controller.js";

import documentUpload from "../middleware/documentUpload.middleware.js";

import {
  createAttachmentSchema,
  updateAttachmentSchema,
} from "../validator/attachment.validation.js";

import validate from "../middleware/validate.js";

const documentRouter = express.Router();

documentRouter
  .route("/document")
  .post(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    documentUpload.single("file"),
    validate(createAttachmentSchema),
    handleAddAttachment,
  )
  .get(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    getDocumnts,
  );

documentRouter
  .route("/document/:id")
  .get(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    getDocumentById,
  )
  .delete(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    deleteDocument,
  )
  .put(
    authMiddleware,
    roleMiddleware("office_owner", "lawyer"),
    documentUpload.single("file"),
    validate(updateAttachmentSchema),
    updateDocument,
  );

export default documentRouter;