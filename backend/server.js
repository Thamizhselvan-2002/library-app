require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/books");
const transactionRoutes = require("./routes/transactions");
const userRoutes = require("./routes/users");

const app = express();

// CORS — allow both local dev and production frontend
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL, // set this in Render env vars to your Vercel URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.endsWith(".netlify.app")) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json({ limit: "10mb" })); // increased for book cover image uploads
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logger
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected", env: process.env.NODE_ENV || "development" })
);

// 404
app.use((_req, res) => res.status(404).json({ message: "Route not found" }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    try {
      const cron = require("node-cron");
      const { runDailyReminders, runFineChecker } = require("./jobs/scheduler");
      cron.schedule("0 8 * * *", () => runDailyReminders().catch(console.error));
      cron.schedule("0 9 * * *", () => runFineChecker().catch(console.error));
      console.log("⏰ Cron jobs scheduled");
    } catch (e) {
      console.warn("Cron not loaded:", e.message);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });
