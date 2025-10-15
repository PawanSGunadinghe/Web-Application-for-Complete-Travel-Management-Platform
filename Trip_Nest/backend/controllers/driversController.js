const mongoose = require("mongoose");
const Driver = require("../models/Driver");

const LICENSE_PATTERNS = [
  /^[0-9]{7}$/,
  /^[A-Z][0-9]{7}$/,
  /^[0-9]{12}$/
];
const validLicense = (s) => LICENSE_PATTERNS.some((rx) => rx.test(String(s || "").trim()));
const todayYmd = () => new Date().toISOString().split("T")[0];

exports.createDriver = async (req, res) => {
    try {
        const f = req.body || {};
        const errors = {};
        const phone = String(f.phone || "").replace(/\D/g, "");
        const emergencyPhone = String(f.emergencyPhone || "").replace(/\D/g, "");
        const licenseNumber = String(f.licenseNumber || "").toUpperCase().trim();
        const vehicles = Array.isArray(f.vehicles) ? [...new Set(f.vehicles.map(String))] : [];
        if (!String(f.fullName || "").trim()) errors.fullName = "Required";
        if (!f.gender) errors.gender = "Required";
        if (phone.length !== 10) errors.phone = "Must be 10 digits";
        if (emergencyPhone.length !== 10) errors.emergencyPhone = "Must be 10 digits";
        if (!String(f.address || "").trim()) errors.address = "Required";
        if (!licenseNumber) errors.licenseNumber = "Required";
        else if (!validLicense(licenseNumber)) errors.licenseNumber = "Invalid license format";
        if (!f.licenseExpiry) errors.licenseExpiry = "Required";
        else if (String(f.licenseExpiry) < todayYmd()) errors.licenseExpiry = "Cannot be before today";
        const exp = Number(f.experienceYears);
        if (Number.isNaN(exp)) errors.experienceYears = "Required";
        else if (exp > 80 || exp < 0) errors.experienceYears = "Unrealistic value";
        if (!vehicles.length) errors.vehicles = "Select at least one";
        if (Object.keys(errors).length) return res.status(400).json({ errors });
        const doc = await Driver.create({
            fullName: String(f.fullName).trim(),
            gender: f.gender,
            phone,
            emergencyPhone,
            address: String(f.address).trim(),
            licenseNumber,
            licenseExpiry: new Date(f.licenseExpiry),
            experienceYears: exp,
            vehicles,
            healthInfo: String(f.healthInfo || "").trim(),
        });
        res.status(201).json({ id: doc._id.toString() });
    } catch (e) {
        console.error("Create driver failed:", e);
        res.status(500).json({ error: "Server error" });
    }
};

exports.listDrivers = async (_req, res) => {
    const items = await Driver.find()
        .select("_id fullName phone licenseNumber vehicles createdAt")
        .sort({ createdAt: -1 })
        .lean();
    res.json(items);
};

exports.getDriver = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });
    const doc = await Driver.findById(id).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
};

exports.updateDriver = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });
        const f = req.body || {};
        const errors = {};
        const phone = f.phone !== undefined ? String(f.phone).replace(/\D/g, "") : undefined;
        const emergencyPhone = f.emergencyPhone !== undefined ? String(f.emergencyPhone).replace(/\D/g, "") : undefined;
        const licenseNumber = f.licenseNumber !== undefined ? String(f.licenseNumber).toUpperCase().trim() : undefined;
        if (f.fullName !== undefined && !String(f.fullName || "").trim()) errors.fullName = "Required";
        if (f.gender !== undefined && !f.gender) errors.gender = "Required";
        if (phone !== undefined && phone.length !== 10) errors.phone = "Must be 10 digits";
        if (emergencyPhone !== undefined && emergencyPhone.length !== 10) errors.emergencyPhone = "Must be 10 digits";
        if (f.address !== undefined && !String(f.address || "").trim()) errors.address = "Required";
        if (licenseNumber !== undefined) {
            if (!licenseNumber) errors.licenseNumber = "Required";
            else {
                const pats = [/^[0-9]{7}$/, /^[A-Z][0-9]{7}$/, /^[0-9]{12}$/];
                const ok = pats.some((rx) => rx.test(licenseNumber));
                if (!ok) errors.licenseNumber = "Invalid license format";
            }
        }
        if (f.licenseExpiry !== undefined) {
            const todayYmd = () => new Date().toISOString().split("T")[0];
            if (!f.licenseExpiry) errors.licenseExpiry = "Required";
            else if (String(f.licenseExpiry) < todayYmd()) errors.licenseExpiry = "Cannot be before today";
        }
        if (f.experienceYears !== undefined) {
            const n = Number(f.experienceYears);
            if (!Number.isFinite(n)) errors.experienceYears = "Required";
            else if (n < 0 || n > 80) errors.experienceYears = "Unrealistic value";
        }
        if (f.vehicles !== undefined && (!Array.isArray(f.vehicles) || f.vehicles.length === 0)) {
            errors.vehicles = "Select at least one";
        }
        if (Object.keys(errors).length) return res.status(400).json({ errors });
        const update = {};
        if (f.fullName !== undefined) update.fullName = String(f.fullName).trim();
        if (f.gender !== undefined) update.gender = f.gender;
        if (phone !== undefined) update.phone = phone;
        if (emergencyPhone !== undefined) update.emergencyPhone = emergencyPhone;
        if (f.address !== undefined) update.address = String(f.address).trim();
        if (licenseNumber !== undefined) update.licenseNumber = licenseNumber;
        if (f.licenseExpiry !== undefined) update.licenseExpiry = new Date(f.licenseExpiry);
        if (f.experienceYears !== undefined) update.experienceYears = Number(f.experienceYears);
        if (f.vehicles !== undefined) update.vehicles = Array.from(new Set(f.vehicles.map(String)));
        if (f.healthInfo !== undefined) update.healthInfo = String(f.healthInfo || "").trim();
        const doc = await Driver.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true, lean: true });
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json(doc);
    } catch (e) {
        console.error("Update driver failed:", e);
        res.status(500).json({ error: "Server error" });
    }
};

exports.deleteDriver = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });
        const doc = await Driver.findByIdAndDelete(id).lean();
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json({ ok: true });
    } catch (e) {
        console.error("Delete driver failed:", e);
        res.status(500).json({ error: "Server error" });
    }
};
