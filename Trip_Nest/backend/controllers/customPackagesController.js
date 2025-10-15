const mongoose = require("mongoose");
const CustomPackage = require("../models/CustomPackage");
const GuideApplication = require("../models/GuideApplication");
const Vehicle = require("../models/Vehicle");

const normalizePhone = (v) => String(v || "").replace(/\D/g, "").slice(0, 15);

exports.createCustomPackage = async (req, res) => {
    try {
        const payload = {
            fullName: (req.body.fullName || "").trim(),
            email: (req.body.email || "").trim(),
            phone: normalizePhone(req.body.phone),
            country: (req.body.country || "").trim(),
            travellers: Number(req.body.travellers),
            preferredDates: {
                start: req.body?.preferredDates?.start || req.body?.startDate,
                end: req.body?.preferredDates?.end || req.body?.endDate,
            },
            destinations: (req.body.destinations || "").trim(),
            durationDays: Number(req.body.durationDays ?? req.body.duration),
        };
        const created = await CustomPackage.create(payload);
        res.status(201).json(created);
    } catch (err) {
        if (err?.name === "ValidationError") {
            return res.status(400).json({
                error: "Validation failed",
                details: Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message])),
            });
        }
        console.error(err);
        res.status(500).json({ error: "Failed to create custom package" });
    }
};

exports.listCustomPackages = async (_req, res) => {
    try {
        const items = await CustomPackage.find().sort({ createdAt: -1 }).lean();
        res.json({ items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch requests" });
    }
};

exports.getCustomPackage = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
        const doc = await CustomPackage.findById(req.params.id).lean();
        if (!doc) return res.status(404).json({ error: "Not found" });
        let guide = null;
        let vehicles = [];
        if (doc.assignedGuideId) {
            guide = await GuideApplication.findById(doc.assignedGuideId).lean().catch(() => null);
        }
        if (Array.isArray(doc.assignedVehicleIds) && doc.assignedVehicleIds.length) {
            vehicles = await Vehicle.find({ _id: { $in: doc.assignedVehicleIds } }).lean().catch(() => []);
        }
        res.json({ ...doc, _guide: guide, _vehicles: vehicles });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch request" });
    }
};

exports.updateAssignment = async (req, res) => {
    try {
        const { assignedGuideId, assignedVehicleIds, assignmentNotes } = req.body || {};
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
        let guideId = null;
        if (assignedGuideId) {
            if (!mongoose.isValidObjectId(assignedGuideId)) return res.status(400).json({ error: "Invalid guide id" });
            const g = await GuideApplication.findById(assignedGuideId).select("_id").lean();
            if (!g) return res.status(404).json({ error: "Guide not found" });
            guideId = g._id;
        }
        let vehicleIds = [];
        if (Array.isArray(assignedVehicleIds)) {
            const valid = assignedVehicleIds.filter((x) => mongoose.isValidObjectId(x));
            const vs = await Vehicle.find({ _id: { $in: valid } }).select("_id").lean();
            vehicleIds = vs.map((v) => v._id);
        }
        const doc = await CustomPackage.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: "Not found" });
        if (assignedGuideId !== undefined) doc.assignedGuideId = guideId;
        if (assignedVehicleIds !== undefined) doc.assignedVehicleIds = vehicleIds;
        if (assignmentNotes !== undefined) doc.assignmentNotes = String(assignmentNotes || "");
        await doc.save();
        res.json(doc.toObject());
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update assignment" });
    }
};

// update custom package (PUT - full update)
exports.updateCustomPackage = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
        const doc = await CustomPackage.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: "Not found" });
        
        const { fullName, email, phone, country, travellers, preferredDates, durationDays, destinations } = req.body;
        
        if (fullName !== undefined) doc.fullName = fullName.trim();
        if (email !== undefined) doc.email = email.trim();
        if (phone !== undefined) doc.phone = normalizePhone(phone);
        if (country !== undefined) doc.country = country.trim();
        if (travellers !== undefined) doc.travellers = Number(travellers);
        if (preferredDates !== undefined) doc.preferredDates = preferredDates;
        if (durationDays !== undefined) doc.durationDays = Number(durationDays);
        if (destinations !== undefined) doc.destinations = destinations.trim();
        
        await doc.save();
        res.json(doc.toObject());
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update" });
    }
};

// update status (approve)
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
        const doc = await CustomPackage.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: "Not found" });
        
        const validStatuses = ["pending", "approved", "assigned", "confirmed", "completed", "cancelled"];
        if (status && validStatuses.includes(status)) {
            doc.status = status;
        }
        await doc.save();
        res.json(doc.toObject());
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update status" });
    }
};

//delete package

exports.deleteCustomPackage = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
        const result = await CustomPackage.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ error: "Not found" });
        res.json({ ok: true, deletedId: req.params.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete request" });
    }
};
