require("express-async-errors");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const rateLimit = require("express-rate-limit");

const errorHandler = require("./middlewares/errorHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const aiRoutes = require("./routes/aiRoutes");
const ragRoutes = require("./routes/ragRoutes");
const agentRoutes = require("./routes/agentRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.disable("x-powered-by");

/** Security & basics */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  }),
);
app.use(morgan("dev"));

/** OPEN CORS for all origins (no cookies) */
const corsOpen = {
  origin: "*", // allow ALL origins
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Length", "X-Request-Id"],
  maxAge: 86400,
  credentials: false, // must be false with "*"
};

app.use(cors(corsOpen));
app.options("*", cors(corsOpen)); // handle preflight for all routes

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", rateLimit({ windowMs: 60_000, max: 200 }));

app.get("/", (_req, res) =>
  res.json({ name: "EduForge LMS API", status: "ok" }),
);
app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date() }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use("/api/ai", aiRoutes);
app.use("/api/rag", ragRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) =>
  res.status(404).json({ message: `Route ${req.originalUrl} not found` }),
);
app.use(errorHandler);

module.exports = app;
