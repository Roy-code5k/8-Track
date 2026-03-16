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

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/push", pushRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "8Track API is running 🚀" });
});

// Start the server immediately so it doesn't block incoming requests
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Connect to MongoDB in the background
mongoose
.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 60000,
})
.then(() => {
    console.log('✅ Connected to MongoDB Atlas');
})
.catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    // Don't exit process so the API can still report health checks
});

