import express from "express";
import "dotenv/config";
import connectedDb from "./src/config/db.js";
import userRoutes from "./src/routes/user.route.js";
import officeRoutes from "./src/routes/office.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import lawyerRoutes from "./src/routes/lawyer.route.js";
import clientRouter from "./src/routes/clients.routes.js";
import cors from "cors";
import caseTypeRouter from "./src/routes/caseType.route.js";
import caseRouter from "./src/routes/case.routes.js";
import sessionRouter from "./src/routes/session.route.js";
import categoryRouter from "./src/routes/category.routes.js";
import documentRouter from "./src/routes/document.route.js";
import notesRouter from "./src/routes/notes.routes.js";
import timeLineRouter from "./src/routes/timeLine.route.js";
import "./src/jobs/sessionReminder.job.js";
import dashboardRouter from "./src/routes/dashboard.routes.js";
import errorMiddleware from "./src/middleware/errorMiddleware.js";
import notificationRouter from "./src/routes/notification.routes.js";
import adminNotificationRouter from "./src/routes/adminNotification.routes.js";

const app = express();
const port = 3001;

app.use(cors());

connectedDb();

app.use(express.json());

app.use("/api", userRoutes);
app.use("/api", authRoutes);
app.use("/api", officeRoutes);
app.use("/api", lawyerRoutes);
app.use("/api", clientRouter);
app.use("/api", caseTypeRouter);
app.use("/api", caseRouter);
app.use("/api", sessionRouter);
app.use("/api", categoryRouter);
app.use("/api", documentRouter);
app.use("/api", notesRouter);
app.use("/api", timeLineRouter);
app.use("/api", dashboardRouter);
app.use("/api", notificationRouter);
app.use("/api", adminNotificationRouter);
app.use(errorMiddleware);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
