const path = require("path");
const fs = require("fs");
const multer = require("multer");
const mongoose = require("mongoose");
const Package = require("../models/Package");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "packages");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const ts = Date.now();
        const ext = path.extname(file.originalname) || ".jpg";
        cb(null, `pkg_${ts}_${Math.random().toString(36).slice(2)}${ext}`);
    },
});
const fileFilter = (_req, file, cb) => {
    if (/^image\/(png|jpeg|jpg|webp|gif)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed"));
};
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});
const badReq = (errors) => ({ errors });
const isValidEmail = (s) => /.+@.+\..+/.test(String(s || ""));
const todayYmd = () => new Date().toISOString().split("T")[0];

exports.upload = upload;

exports.createPackage = async (req, res) => {
    try {
        const f = req.body;
        const errors = {};
        if (!String(f.name || "").trim()) errors.name = "Package name is required";
        if (!f.startDate) errors.startDate = "Start date is required";
        if (!f.endDate) errors.endDate = "End date is required";
        if (f.startDate) {
            const start = new Date(f.startDate);
            const today = new Date(todayYmd());
            if (isNaN(start)) errors.startDate = "Invalid start date";
            else if (start < today) errors.startDate = "Start date can't be in the past";
        }
        if (f.endDate) {
            const end = new Date(f.endDate);
            const today = new Date(todayYmd());
            if (isNaN(end)) errors.endDate = "Invalid end date";
            else if (end < today) errors.endDate = "End date can't be in the past";
            if (f.startDate) {
                const start = new Date(f.startDate);
                if (!isNaN(start) && end < start) errors.endDate = "End date can't be before start date";
            }
        }
        const contact = String(f.contact || "").replace(/\D/g, "");
        if (contact.length !== 10) errors.contact = "Contact must be 10 digits";
        if (!isValidEmail(f.email)) errors.email = "Enter a valid email";
        let maxTourist = Number(f.maxTourist ?? 10);
        if (!Number.isFinite(maxTourist) || maxTourist < 0) {
            errors.maxTourist = "Max tourist must be 0 or more";
            maxTourist = 0;
        }
        let price = Number(f.price ?? 0);
        if (!Number.isFinite(price) || price < 0) {
            errors.price = "Price must be 0 or more";
            price = 0;
        }
        if (Object.keys(errors).length) {
            for (const file of req.files || []) fs.unlink(file.path, () => {});
            return res.status(400).json(badReq(errors));
        }
        const imageUrls = (req.files || []).map((f) => `/uploads/packages/${path.basename(f.path)}`);
        const doc = await Package.create({
            name: String(f.name).trim(),
            about: String(f.about || "").trim(),
            maxTourist,
            startDate: new Date(f.startDate),
            endDate: new Date(f.endDate),
            contact,
            email: String(f.email).trim().toLowerCase(),
            price,
            guide: String(f.guide || "").trim(),
            imageUrls,
        });
        return res.status(201).json({ id: doc._id.toString() });
    } catch (err) {
        console.error("Create package failed:", err);
        return res.status(500).json({ error: "Server error" });
    }
};

exports.listPackages = async (_req, res) => {
    const items = await Package.find()
        .select("_id name price startDate endDate guide imageUrls promotion createdAt")
        .populate("promotion", "name discountPercent startDate endDate")
        .sort({ createdAt: -1 })
        .lean();
    res.json(items);
};

exports.getPackage = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }
        const doc = await Package.findById(id)
            .populate("promotion", "name discountPercent startDate endDate")
            .lean();
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json(doc);
    } catch (err) {
        console.error("Error fetching package:", err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.updatePackage = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }
        const {
            name,
            about,
            maxTourist,
            startDate,
            endDate,
            contact,
            email,
            price,
            guide,
        } = req.body || {};
        const errors = {};
        if (name !== undefined && !String(name || "").trim()) {
            errors.name = "Package name is required";
        }
        const todayMidnight = new Date(new Date().toISOString().split("T")[0]);
        let start = startDate ? new Date(startDate) : undefined;
        let end = endDate ? new Date(endDate) : undefined;
        if (startDate !== undefined) {
            if (isNaN(start)) errors.startDate = "Invalid start date";
            else if (start < todayMidnight) errors.startDate = "Start date can't be in the past";
        }
        if (endDate !== undefined) {
            if (isNaN(end)) errors.endDate = "Invalid end date";
            else if (end < todayMidnight) errors.endDate = "End date can't be in the past";
            if (start && end < start) errors.endDate = "End date can't be before start date";
        }
        if (contact !== undefined) {
            const digits = String(contact || "").replace(/\D/g, "");
            if (digits.length !== 10) errors.contact = "Contact must be 10 digits";
        }
        if (email !== undefined) {
            if (!/.+@.+\..+/.test(String(email || ""))) errors.email = "Enter a valid email";
        }
        if (maxTourist !== undefined) {
            const n = Number(maxTourist);
            if (!Number.isFinite(n) || n < 0) errors.maxTourist = "Max tourist must be 0 or more";
        }
        if (price !== undefined) {
            const n = Number(price);
            if (!Number.isFinite(n) || n < 0) errors.price = "Price must be 0 or more";
        }
        if (Object.keys(errors).length) {
            return res.status(400).json({ errors });
        }
        const update = {};
        if (name !== undefined) update.name = String(name).trim();
        if (about !== undefined) update.about = String(about || "").trim();
        if (guide !== undefined) update.guide = String(guide || "").trim();
        if (maxTourist !== undefined) update.maxTourist = Number(maxTourist);
        if (price !== undefined) update.price = Number(price);
        if (contact !== undefined) update.contact = String(contact).replace(/\D/g, "");
        if (email !== undefined) update.email = String(email).trim().toLowerCase();
        if (startDate !== undefined) update.startDate = new Date(startDate);
        if (endDate !== undefined) update.endDate = new Date(endDate);
        const doc = await Package.findByIdAndUpdate(
            id,
            { $set: update },
            { new: true, runValidators: true, lean: true }
        );
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json(doc);
    } catch (err) {
        console.error("Update package failed:", err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.deletePackage = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }
        const doc = await Package.findByIdAndDelete(id).lean();
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json({ ok: true });
    } catch (err) {
        console.error("Delete package failed:", err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.multerErrorHandler = (err, _req, res, _next) => {
    if (err) {
        console.error("packages route error:", err.message);
        return res.status(400).json({ error: err.message });
    }
};
