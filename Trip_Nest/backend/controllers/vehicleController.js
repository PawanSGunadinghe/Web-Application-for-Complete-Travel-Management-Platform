const mongoose = require("mongoose");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");

const currentYear = new Date().getFullYear();
const REG_MODERN = /^[A-Z]{2,3}[- ]?\d{4}$/i;
const REG_LEGACY_SRI = /^(\d{1,2})\s*(Sri|ශ්‍රී)\s*(\d{3})$/i;
function isValidSLRegistration(s) {
    const val = String(s || "").trim();
    return REG_MODERN.test(val) || REG_LEGACY_SRI.test(val);
}
const plateRegex = /^(?:[A-Z]{2}\s?[A-Z]{2,3}\s?\d{4})$/;
const todayYmd = () => new Date().toISOString().split("T")[0];

exports.createVehicle = async (req, res) => {
    try {
        const f = req.body || {};
        const errors = {};
        const numberPlate = String(f.numberPlate || "").toUpperCase().trim();
        if (!numberPlate) errors.numberPlate = "Required";
        else if (!plateRegex.test(numberPlate)) errors.numberPlate = "Format like WP CAE 1234";
        if (!f.vehicleType) errors.vehicleType = "Required";
        if (!String(f.vehicleModel || "").trim()) errors.vehicleModel = "Required";
        if (!String(f.manufacturer || "").trim()) errors.manufacturer = "Required";
        const yom = Number(f.yearOfManufacture);
        if (!Number.isFinite(yom)) errors.yearOfManufacture = "Required";
        else if (yom < 1950) errors.yearOfManufacture = "Year must be ≥ 1950";
        else if (yom > currentYear) errors.yearOfManufacture = `Year must be ≤ ${currentYear}`;
        const registrationNumber = String(f.registrationNumber || "").toUpperCase().trim();
        if (!registrationNumber) errors.registrationNumber = "Required";
        else if (!isValidSLRegistration(registrationNumber)) errors.registrationNumber = "Invalid SL registration format";
        const chassisNumber = String(f.chassisNumber || "").toUpperCase().trim();
        if (!chassisNumber) errors.chassisNumber = "Required";
        const engineNumber = String(f.engineNumber || "").toUpperCase().trim();
        if (!engineNumber) errors.engineNumber = "Required";
        else if (!/^[A-Za-z0-9\-\/\.]{5,20}$/.test(engineNumber))
            errors.engineNumber = "5–20 chars; letters/digits -/. allowed";
        if (!String(f.insurancePolicyNumber || "").trim()) errors.insurancePolicyNumber = "Required";
        if (!f.insuranceExpiry) errors.insuranceExpiry = "Required";
        else if (String(f.insuranceExpiry) <= todayYmd()) errors.insuranceExpiry = "Must be a future date";
        if (!f.revenueLicenseExpiry) errors.revenueLicenseExpiry = "Required";
        else if (String(f.revenueLicenseExpiry) <= todayYmd()) errors.revenueLicenseExpiry = "Must be a future date";
        if (!f.fuelType) errors.fuelType = "Required";
        if (!f.transmission) errors.transmission = "Required";
        const cap = Number(f.seatingCapacity);
        if (!Number.isFinite(cap)) errors.seatingCapacity = "Required";
        else if (cap < 1) errors.seatingCapacity = "Min 1";
        else if (cap > 100) errors.seatingCapacity = "Too many";
        if (!f.lastServiceDate) errors.lastServiceDate = "Required";
        else if (String(f.lastServiceDate) > todayYmd()) errors.lastServiceDate = "Cannot be in the future";
        if (!f.currentCondition) errors.currentCondition = "Required";
        const assignedDriverId = f.assignedDriverId;
        if (!assignedDriverId) errors.assignedDriverId = "Select a driver";
        else if (!mongoose.isValidObjectId(assignedDriverId)) errors.assignedDriverId = "Invalid driver id";
        else {
            const exists = await Driver.exists({ _id: assignedDriverId });
            if (!exists) errors.assignedDriverId = "Driver not found";
        }
        if (Object.keys(errors).length) return res.status(400).json({ errors });
        const doc = await Vehicle.create({
            numberPlate,
            vehicleType: f.vehicleType,
            vehicleModel: String(f.vehicleModel).trim(),
            manufacturer: String(f.manufacturer).trim(),
            yearOfManufacture: yom,
            registrationNumber,
            chassisNumber,
            engineNumber,
            insurancePolicyNumber: String(f.insurancePolicyNumber).trim(),
            insuranceExpiry: new Date(f.insuranceExpiry),
            revenueLicenseExpiry: new Date(f.revenueLicenseExpiry),
            fuelType: f.fuelType,
            transmission: f.transmission,
            seatingCapacity: cap,
            lastServiceDate: new Date(f.lastServiceDate),
            currentCondition: f.currentCondition,
            assignedDriverId,
        });
        res.status(201).json({ id: doc._id.toString() });
    } catch (e) {
        if (e?.code === 11000) {
            const field = Object.keys(e.keyPattern || {})[0] || "field";
            return res.status(400).json({ error: `Duplicate ${field}` });
        }
        console.error("Create vehicle failed:", e);
        res.status(500).json({ error: "Server error" });
    }
};

exports.listVehicles = async (_req, res) => {
    const items = await Vehicle.find()
        .select("_id numberPlate vehicleType vehicleModel manufacturer seatingCapacity currentCondition assignedDriverId createdAt")
        .sort({ createdAt: -1 })
        .lean();
    res.json(items);
};

exports.getVehicle = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });
    const doc = await Vehicle.findById(id).populate("assignedDriverId", "fullName phone").lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
};

exports.updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });
        const f = req.body || {};
        const errors = {};
        const todayYmd = () => new Date().toISOString().split("T")[0];
        const update = {};
        if (f.numberPlate !== undefined) {
            const v = String(f.numberPlate).toUpperCase().trim();
            if (!v) errors.numberPlate = "Required";
            else if (!plateRegex.test(v)) errors.numberPlate = "Format like WP CAE 1234";
            update.numberPlate = v;
        }
        if (f.vehicleType !== undefined) {
            if (!f.vehicleType) errors.vehicleType = "Required";
            update.vehicleType = f.vehicleType;
        }
        if (f.vehicleModel !== undefined) {
            if (!String(f.vehicleModel || "").trim()) errors.vehicleModel = "Required";
            update.vehicleModel = String(f.vehicleModel).trim();
        }
        if (f.manufacturer !== undefined) {
            if (!String(f.manufacturer || "").trim()) errors.manufacturer = "Required";
            update.manufacturer = String(f.manufacturer).trim();
        }
        if (f.yearOfManufacture !== undefined) {
            if (f.yearOfManufacture === "") errors.yearOfManufacture = "Required";
            else {
                const yr = Number(f.yearOfManufacture);
                if (!Number.isFinite(yr)) errors.yearOfManufacture = "Required";
                else if (yr < 1950) errors.yearOfManufacture = "Year must be ≥ 1950";
                else if (yr > currentYear) errors.yearOfManufacture = `Year must be ≤ ${currentYear}`;
                update.yearOfManufacture = yr;
            }
        }
        if (f.registrationNumber !== undefined) {
            const v = String(f.registrationNumber).toUpperCase().trim();
            if (!v) errors.registrationNumber = "Required";
            else if (!isValidSLRegistration(v)) errors.registrationNumber = "Invalid SL registration format";
            update.registrationNumber = v;
        }
        if (f.chassisNumber !== undefined) {
            const v = String(f.chassisNumber).toUpperCase().trim();
            if (!v) errors.chassisNumber = "Required";
            update.chassisNumber = v;
        }
        if (f.engineNumber !== undefined) {
            const v = String(f.engineNumber).toUpperCase().trim();
            if (!v) errors.engineNumber = "Required";
            else if (!/^[A-Za-z0-9\-\/\.]{5,20}$/.test(v))
                errors.engineNumber = "5–20 chars; letters/digits -/. allowed";
            update.engineNumber = v;
        }
        if (f.insurancePolicyNumber !== undefined) {
            if (!String(f.insurancePolicyNumber || "").trim()) errors.insurancePolicyNumber = "Required";
            update.insurancePolicyNumber = String(f.insurancePolicyNumber).trim();
        }
        if (f.insuranceExpiry !== undefined) {
            if (!f.insuranceExpiry) errors.insuranceExpiry = "Required";
            else if (String(f.insuranceExpiry) <= todayYmd()) errors.insuranceExpiry = "Must be a future date";
            update.insuranceExpiry = new Date(f.insuranceExpiry);
        }
        if (f.revenueLicenseExpiry !== undefined) {
            if (!f.revenueLicenseExpiry) errors.revenueLicenseExpiry = "Required";
            else if (String(f.revenueLicenseExpiry) <= todayYmd()) errors.revenueLicenseExpiry = "Must be a future date";
            update.revenueLicenseExpiry = new Date(f.revenueLicenseExpiry);
        }
        if (f.fuelType !== undefined) {
            if (!f.fuelType) errors.fuelType = "Required";
            update.fuelType = f.fuelType;
        }
        if (f.transmission !== undefined) {
            if (!f.transmission) errors.transmission = "Required";
            update.transmission = f.transmission;
        }
        if (f.seatingCapacity !== undefined) {
            if (f.seatingCapacity === "") errors.seatingCapacity = "Required";
            else {
                const n = Number(f.seatingCapacity);
                if (!Number.isFinite(n)) errors.seatingCapacity = "Required";
                else if (n < 1) errors.seatingCapacity = "Min 1";
                else if (n > 100) errors.seatingCapacity = "Too many";
                update.seatingCapacity = n;
            }
        }
        if (f.lastServiceDate !== undefined) {
            if (!f.lastServiceDate) errors.lastServiceDate = "Required";
            else if (String(f.lastServiceDate) > todayYmd()) errors.lastServiceDate = "Cannot be in the future";
            update.lastServiceDate = new Date(f.lastServiceDate);
        }
        if (f.currentCondition !== undefined) {
            if (!f.currentCondition) errors.currentCondition = "Required";
            update.currentCondition = f.currentCondition;
        }
        if (f.assignedDriverId !== undefined) {
            if (!f.assignedDriverId) errors.assignedDriverId = "Select a driver";
            else if (!mongoose.isValidObjectId(f.assignedDriverId)) errors.assignedDriverId = "Invalid driver id";
            else {
                const exists = await Driver.exists({ _id: f.assignedDriverId });
                if (!exists) errors.assignedDriverId = "Driver not found";
            }
            update.assignedDriverId = f.assignedDriverId;
        }
        if (Object.keys(errors).length) return res.status(400).json({ errors });
        const doc = await Vehicle.findByIdAndUpdate(
            id,
            { $set: update },
            { new: true, runValidators: true, lean: true }
        );
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json(doc);
    } catch (e) {
        if (e?.code === 11000) {
            const field = Object.keys(e.keyPattern || {})[0] || "field";
            return res.status(400).json({ error: `Duplicate ${field}` });
        }
        console.error("Update vehicle failed:", e);
        res.status(500).json({ error: "Server error" });
    }
};

exports.deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });
        const doc = await Vehicle.findByIdAndDelete(id).lean();
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json({ ok: true });
    } catch (e) {
        console.error("Delete vehicle failed:", e);
        res.status(500).json({ error: "Server error" });
    }
};
