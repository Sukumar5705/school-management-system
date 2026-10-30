
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

const rootEnv = path.resolve(__dirname, "../.env");
const localEnv = path.resolve(__dirname, ".env");

dotenv.config({
  path: fs.existsSync(rootEnv) ? rootEnv : localEnv,
});

const studentRoutes = require("./routes/studentRoutes");

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const clientDist = path.resolve(__dirname, "../client/dist");

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "database-disconnected",
    database: connected ? "connected" : "disconnected",
  });
});

// Student CRUD routes
app.use("/api/students", studentRoutes);

// Serve React production build
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

// Home route
app.get("/", (req, res) => {
  const indexFile = path.join(clientDist, "index.html");

  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }

  return res.json({
    message: "Student Management System API is running.",
  });
});

// Unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    message: "API endpoint not found.",
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error.message);

  res.status(500).json({
    message: "Internal server error.",
  });
});

// Start server only after MongoDB connects
async function startServer() {
  const mongoUri = 'mongodb+srv://galigopuram4_db_user:WQ2FtRGDqZ5QWvAI@cluster0.uw3xp19.mongodb.net/?appName=Cluster0';

  if (!mongoUri) {
    console.error("MONGODB_URI is missing from .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB Atlas connected successfully.");
    console.log("Database:", mongoose.connection.name);

    app.listen(PORT, "127.0.0.1", () => {
      console.log(`Backend running at http://127.0.0.1:${PORT}`);
      console.log(`Student API: http://127.0.0.1:${PORT}/api/students`);
    });

  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
