const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      unique: true,
      trim: true,
      minlength: [2, "Student ID must contain at least 2 characters"],
      maxlength: [30, "Student ID cannot exceed 30 characters"],
    },
    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [150, "Email cannot exceed 150 characters"],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"],
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      maxlength: [20, "Phone number cannot exceed 20 characters"],
    },
    course: {
      type: String,
      required: [true, "Course is required"],
      enum: {
        values: ["CSE", "ECE", "EEE", "DS"],
        message: "Select a valid course",
      },
    },
    year: {
      type: String,
      required: [true, "Year of study is required"],
      enum: {
        values: ["1", "2", "3", "4"],
        message: "Select a valid year of study",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Student", studentSchema);
