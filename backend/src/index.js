const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const subjectRoutes = require("./routes/subject.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const assignmentRoutes = require("./routes/assignment.routes");
const taskRoutes = require("./routes/task.routes");
const examRoutes = require("./routes/exam.routes");
const pushRoutes = require("./routes/push.routes");
const scheduleRoutes = require("./routes/schedule.routes");
const googleRoutes = require("./routes/google.routes");
const notificationRoutes = require("./routes/notification.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/google", googleRoutes);
app.use("/api/notifications", notificationRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "8Track API is running 🚀" });
});

// ── 404 Not Found (must be after all routes) ──────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler (must be last middleware) ────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

// ── MongoDB connection ────────────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 60000,
  })
  .then(() => {
    console.log(' Connected to MongoDB Atlas');
  })
  .catch((err) => {
    console.error(' MongoDB connection error:', err.message);
  });

// ── Process-level safety nets ─────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('🔴 Unhandled Rejection:', reason instanceof Error ? reason.stack : reason);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.stack || err.message);
  // process.exit(1); // Keep alive for debugging if possible, or at least see log
});
