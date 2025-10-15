// models/GuideApplication.js
const mongoose = require("mongoose");

const DaysSchema = new mongoose.Schema(
    {
    mon: { type: Boolean, default: false },
    tue: { type: Boolean, default: false },
    wed: { type: Boolean, default: false },
    thu: { type: Boolean, default: false },
    fri: { type: Boolean, default: false },
    sat: { type: Boolean, default: false },
    sun: { type: Boolean, default: false },
    },
    { _id: false }
);

const GuideApplicationSchema = new mongoose.Schema(
    {
    // Personal
    fullName: { type: String, required: true, trim: true },
    birthday: { type: Date, required: true },
    gender: { type: String, enum: ["male", "female", "other", "prefer_not"], required: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true }, // keep as string to preserve leading 0
    email: { type: String, required: true, trim: true, lowercase: true },
    profilePhotoUrl: { type: String, default: "" },

    // Professional
    experienceYears: { type: Number, default: null },
    education: { type: String, default: "" },
    languages: { type: [String], default: [] },
    availabilityType: { type: String, enum: ["full-time", "part-time"], required: true },
    daysAvailable: { type: DaysSchema, default: () => ({}) },
    expectedRate: { type: Number, default: null },
    rateUnit: { type: String, enum: ["per_day", "per_hour"], default: "per_day" },

    // Licensing & Verification
    nationalIdOrPassport: { type: String, required: true, trim: true },
    guideLicenseNo: { type: String, default: "", trim: true },
    emergencyContactName: { type: String, required: true, trim: true },
    emergencyContactPhone: { type: String, required: true },

    // Approval Status
    status: { 
        type: String, 
        enum: ["pending", "approved", "rejected"], 
        default: "pending" 
    },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model("GuideApplication", GuideApplicationSchema);