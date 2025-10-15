const mongoose = require("mongoose");

const allowedRoles = ["customer", "guide", "vehicle_owner", "admin"];

const GuideProfileSchema = new mongoose.Schema(
    {
        licenseNo: String,
        yearsExperience: { type: Number, min: 0, default: 0 },
        languages: [String],
        areas: [String],
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
    },
    { _id: false }
    );

    const VehicleSchema = new mongoose.Schema(
    {
        type: String, // car/van/bus
        plateNo: String,
        seats: Number,
        permitNo: String
    },
    { _id: false }
    );

    const VehicleOwnerProfileSchema = new mongoose.Schema(
    {
        driverLicenseNo: String,
        vehicles: [VehicleSchema],
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
    },
    { _id: false }
    );

    const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        username: { type: String, required: true, unique: true, lowercase: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },

        // multi-role
        roles: { type: [String], enum: allowedRoles, default: ["customer"], index: true },

        // role-specific profiles
        profiles: {
        guide: { type: GuideProfileSchema, default: undefined },
        vehicleOwner: { type: VehicleOwnerProfileSchema, default: undefined }
        }
    },
    { timestamps: true }
);

// No duplicate schema.index calls; 'unique' on fields is enough.
module.exports = mongoose.model("User", userSchema);
