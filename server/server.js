const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Load .env from root and/or server directory
const rootEnv = path.resolve(__dirname, "../.env");
const localEnv = path.resolve(__dirname, ".env");

if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
}
if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv, override: true });
}
// Fallback to default cwd .env
dotenv.config();

const studentRoutes = require("./routes/studentRoutes");

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const clientDist = path.resolve(__dirname, "../client/dist");

app.disable("x-powered-by");

// Enable CORS for all origins in development and production
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

// Request logging in development
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  const readyState = mongoose.connection.readyState;
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  const statusStr = states[readyState] || "unknown";
  const connected = readyState === 1;

  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "database-disconnected",
    database: statusStr,
    databaseName: connected ? mongoose.connection.name : null,
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Student CRUD routes
app.use("/api/students", studentRoutes);

// Serve React production build if available
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  // SPA fallback for non-API routes
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    const indexFile = path.join(clientDist, "index.html");
    if (fs.existsSync(indexFile)) {
      return res.sendFile(indexFile);
    }
    next();
  });
}

// Unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    message: "API endpoint not found.",
  });
});

// Home route fallback if frontend build not present
app.get("/", (req, res) => {
  res.json({
    message: "Student Management System API is running.",
    status: "ok",
    healthCheck: "/api/health",
    studentsEndpoint: "/api/students",
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error.message);
  res.status(500).json({
    message: "Internal server error.",
  });
});

// Resilient MongoDB connection with auto-retry
let retryTimeout = null;

async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("\n[ENV ERROR] MONGODB_URI is missing from your .env file!");
    console.error("Please ensure .env contains a valid MONGODB_URI variable.\n");
    return;
  }

  try {
    console.log("[MongoDB] Attempting to connect...");
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });
    console.log("[MongoDB] Atlas connected successfully.");
    console.log(`[MongoDB] Database: "${mongoose.connection.name}"`);
  } catch (error) {
    console.error("\n============================================================");
    console.error("[MongoDB Connection Error]:", error.message);
    console.error("------------------------------------------------------------");
    console.error("If you are using MongoDB Atlas, check these common reasons:");
    console.error("1. IP Whitelist: Atlas is dropping the connection.");
    console.error("   -> Go to cloud.mongodb.com -> Security -> Network Access");
    console.error("   -> Click 'Add IP Address' -> Select 'Allow Access from Anywhere' (0.0.0.0/0)");
    console.error("      or add your current public IP address.");
    console.error("2. Database Name: Ensure your URI specifies a database name:");
    console.error("   -> e.g. mongodb+srv://<user>:<password>@cluster.mongodb.net/student_db?retryWrites=true...");
    console.error("3. Credentials: Check the database username and password in .env.");
    console.error("============================================================\n");

    // Retry connection after 15 seconds
    if (!retryTimeout) {
      retryTimeout = setTimeout(() => {
        retryTimeout = null;
        if (mongoose.connection.readyState !== 1) {
          console.log("[MongoDB] Retrying connection...");
          connectToDatabase();
        }
      }, 15000);
    }
  }
}

// Start HTTP server immediately so client and health checks are always responsive
function startServer() {
  console.log("\n--- Student Management System Server ---");
  console.log(`[ENV] PORT: ${PORT}`);
  console.log(`[ENV] NODE_ENV: ${process.env.NODE_ENV || "development"}`);
  console.log(`[ENV] MONGODB_URI: ${process.env.MONGODB_URI ? "Configured" : "NOT SET"}`);

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Backend running at http://127.0.0.1:${PORT} (and http://localhost:${PORT})`);
    console.log(`[Server] Health Check: http://127.0.0.1:${PORT}/api/health`);
    console.log(`[Server] Student API:  http://127.0.0.1:${PORT}/api/students\n`);
  });

  // Connect to database in the background
  connectToDatabase();

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = app;
