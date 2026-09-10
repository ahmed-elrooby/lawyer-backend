import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import {
  addNote,
  deleteNote,
  getNotes,
  getNotesById,
  updateNote,
} from "../controller/notes.controller.js";
const notesRouter = express.Router();
notesRouter
  .route("/notes")
  .post(authMiddleware, roleMiddleware("office_owner", "lawyer"), addNote)
  .get(authMiddleware, roleMiddleware("office_owner", "lawyer"), getNotes);
notesRouter
  .route("/notes/:id")
  .get(authMiddleware, roleMiddleware("office_owner", "lawyer"), getNotesById)
  .put(authMiddleware, roleMiddleware("office_owner", "lawyer"), updateNote)
  .delete(authMiddleware, roleMiddleware("office_owner", "lawyer"), deleteNote);
export default notesRouter;
