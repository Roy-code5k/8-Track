import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import subjectRoutes from './routes/subject.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import taskRoutes from './routes/task.routes.js';
import examRoutes from './routes/exam.routes.js';
import pushRoutes from './routes/push.routes.js';
import scheduleRoutes from './routes/schedule.routes.js';
import googleRoutes from './routes/google.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import errorHandler from './middleware/errorHandler.js';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        process.env.FRONTEND_URL || "http://localhost:5173",
        "https://personify.cloud",
        "https://www.personify.cloud",
      ];
      // Allow requests with no origin (e.g. curl, mobile apps)
      if (!origin || allowed.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
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

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule || process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;

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
