// models/Vehicle.js
const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema(
    {
        // Vehicle Details
        numberPlate: { type: String, required: true, trim: true, uppercase: true, unique: true },
        vehicleType: {
        type: String,
        required: true,
        enum: ["Car", "Van", "Bus", "Lorry", "Motorcycle", "SUV", "Pickup", "Three-Wheeler"],
    },
    vehicleModel: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    yearOfManufacture: { type: Number, required: true, min: 1950, max: new Date().getFullYear() },

    // Registration & Legal
    registrationNumber: { type: String, required: true, trim: true, uppercase: true, unique: true },
    chassisNumber: { type: String, required: true, trim: true, uppercase: true, unique: false }, // required only
    engineNumber: { type: String, required: true, trim: true, uppercase: true },
    insurancePolicyNumber: { type: String, required: true, trim: true },
    insuranceExpiry: { type: Date, required: true },
    revenueLicenseExpiry: { type: Date, required: true },

    // Specifications
    fuelType: { type: String, required: true, enum: ["Petrol", "Diesel", "Hybrid", "Electric"] },
    transmission: { type: String, required: true, enum: ["Manual", "Automatic"] },
    seatingCapacity: { type: Number, required: true, min: 1, max: 100 },

    // Maintenance & Status
    lastServiceDate: { type: Date, required: true },
    currentCondition: { type: String, required: true, enum: ["Good", "Needs Repair", "Inactive"] },

    // Link to a driver (store the Driver _id)
    assignedDriverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
    },
    { timestamps: true }
    );

module.exports = mongoose.model("Vehicle", VehicleSchema);
