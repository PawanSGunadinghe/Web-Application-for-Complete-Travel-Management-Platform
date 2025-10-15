// models/Package.js
const mongoose = require("mongoose");

const PackageSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        about: { type: String, default: "" },
        maxTourist: { type: Number, default: 10, min: 1 },
        startDate: { type: Date },
        endDate:   { type: Date },
        contact:   { type: String, required: true, trim: true }, // keep as string for leading 0
        email:     { type: String, required: true, trim: true, lowercase: true },
        price:     { type: Number, default: 0, min: 0 },
        guide:     { type: String, default: "", trim: true },
        imageUrls: { type: [String], default: [] },

        // ← put it INSIDE the schema definition
        promotion: { type: mongoose.Schema.Types.ObjectId, ref: "Offer", default: null },
    },
    { timestamps: true }
    );

    // Optional: basic date sanity check
    PackageSchema.pre("validate", function (next) {
    if (this.startDate && this.endDate && this.endDate < this.startDate) {
        return next(new Error("endDate cannot be before startDate"));
    }
    next();
});

module.exports = mongoose.model("Package", PackageSchema);
