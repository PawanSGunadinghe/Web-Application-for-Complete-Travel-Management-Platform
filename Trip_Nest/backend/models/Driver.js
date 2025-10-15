// models/Driver.js
const mongoose = require("mongoose");

const DriverSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true },
        gender: {
        type: String,
        required: true,
        enum: ["Male", "Female", "Other", "Prefer not to say"],
        },
        phone: { type: String, required: true },           // store 10 digits as string
        emergencyPhone: { type: String, required: true },  // 10 digits
        address: { type: String, required: true, trim: true },

        licenseNumber: { type: String, required: true, trim: true, uppercase: true },
        licenseExpiry: { type: Date, required: true },

        experienceYears: { type: Number, required: true, min: 0, max: 80 },

        // You can switch to ObjectId refs later if you add a Vehicle collection
        vehicles: { type: [String], default: [] }, // e.g. ["VAN-01", "BUS-02"]

        healthInfo: { type: String, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Driver", DriverSchema);
