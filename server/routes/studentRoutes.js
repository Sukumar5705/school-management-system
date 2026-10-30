const express = require("express");
const mongoose = require("mongoose");
const Student = require("../models/Student");

const router = express.Router();
const allowedFields = ["studentId", "name", "email", "phone", "course", "year"];

function pickStudentFields(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {};
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key))
  );
}

function handleDatabaseError(error, res, action) {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    const message = field === "email"
      ? "A student with this email address already exists."
      : "A student with this Student ID already exists.";
    return res.status(409).json({ message });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    const message = error.name === "ValidationError"
      ? Object.values(error.errors).map((item) => item.message).join(" ")
      : "Invalid student record identifier.";
    return res.status(400).json({ message });
  }

  console.error(`${action}:`, error.message);
  return res.status(500).json({ message: `Unable to ${action.toLowerCase()}. Please try again.` });
}

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Ensure database is connected before handling student operations
router.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message:
        "Database is currently disconnected. Please verify MongoDB Atlas IP whitelist (allow 0.0.0.0/0) or check network connection.",
    });
  }
  next();
});

// Read all student records.
router.get("/", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json(students);
  } catch (error) {
    return handleDatabaseError(error, res, "Fetch students");
  }
});

// Read one student record.
router.get("/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: "Invalid student record identifier." });
  }

  try {
    const student = await Student.findById(req.params.id).lean();
    if (!student) return res.status(404).json({ message: "Student not found." });
    return res.status(200).json(student);
  } catch (error) {
    return handleDatabaseError(error, res, "Fetch student");
  }
});

// Create a student record.
router.post("/", async (req, res) => {
  const payload = pickStudentFields(req.body);
  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ message: "Provide the student details to save." });
  }

  try {
    const student = await Student.create(payload);
    return res.status(201).json(student);
  } catch (error) {
    return handleDatabaseError(error, res, "Create student");
  }
});

// Update an existing student record.
router.put("/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: "Invalid student record identifier." });
  }

  const payload = pickStudentFields(req.body);
  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ message: "Provide at least one valid field to update." });
  }

  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true, context: "query" }
    );
    if (!student) return res.status(404).json({ message: "Student not found." });
    return res.status(200).json(student);
  } catch (error) {
    return handleDatabaseError(error, res, "Update student");
  }
});

// Delete a student record.
router.delete("/:id", async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: "Invalid student record identifier." });
  }

  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found." });
    return res.status(200).json({ message: "Student deleted successfully." });
  } catch (error) {
    return handleDatabaseError(error, res, "Delete student");
  }
});

module.exports = router;
