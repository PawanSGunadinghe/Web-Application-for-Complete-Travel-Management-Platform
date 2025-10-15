// models/CustomPackage.js
const mongoose = require("mongoose");

const preferredDatesSchema = new mongoose.Schema(
    { start: { type: Date, required: true }, end: { type: Date, required: true } },
    { _id: false }
    );

    const customPackageSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true },
        email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Invalid email address"],
        },
       
        phone: {
        type: String,
        required: true,
        trim: true,
        validate: { validator: (v) => /^\d{1,15}$/.test(String(v).replace(/\D/g, "")) },
        },
       
        country: { type: String, required: true, trim: true },
        
        travellers: { type: Number, required: true, min: 1 },
        
        preferredDates: {
        type: preferredDatesSchema,
        required: true,
        validate: {
            validator: (d) => {
            const today = new Date(); today.setHours(0,0,0,0);
            const s = new Date(d.start), e = new Date(d.end);
            return s >= today && e >= today && e >= s;
            },
            message: "Dates must not be in the past and end >= start",
        },
        },
       
        destinations: { type: String, required: true, trim: true, maxlength: 500 },
       
        durationDays: { type: Number, required: true, min: 1 },

        // 🔵 NEW: assignment fields
        assignedGuideId: { type: mongoose.Schema.Types.ObjectId, ref: "GuideApplication", default: null },
        assignedVehicleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: [] }],

        // optional simple status
        status: {
        type: String,
        enum: ["pending", "approved", "assigned", "confirmed", "completed", "cancelled"],
        default: "pending",
        },
        assignmentNotes: { type: String, default: "" },
        assignedAt: { type: Date, default: null },
    },
    { timestamps: true }
    );

    // convenience: keep status in sync
    customPackageSchema.pre("save", function (next) {
    if (this.isModified("assignedGuideId") || this.isModified("assignedVehicleIds")) {
        const hasAny = !!this.assignedGuideId || (Array.isArray(this.assignedVehicleIds) && this.assignedVehicleIds.length);
        this.status = hasAny ? "assigned" : (this.status === "assigned" ? "new" : this.status);
        this.assignedAt = hasAny ? (this.assignedAt || new Date()) : null;
    }
    next();
});

module.exports = mongoose.model("CustomPackage", customPackageSchema);
