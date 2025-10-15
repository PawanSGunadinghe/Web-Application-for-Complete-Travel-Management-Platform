// controllers/guideApplicationsController.js
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const mongoose = require("mongoose");
const GuideApplication = require("../models/GuideApplication");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const ts = Date.now();
        const ext = path.extname(file.originalname) || ".jpg";
        cb(null, `profile_${ts}${ext}`);
    },
});
const fileFilter = (_req, file, cb) => {
    if (/^image\/(png|jpeg|jpg|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed"));
};
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
});
const badReq = (errors) => ({ errors });
const is21OrOlder = (yyyyMmDd) => {
    const b = new Date(yyyyMmDd);
    if (Number.isNaN(b.getTime())) return false;
    const now = new Date();
    const cutoff = new Date(now.getFullYear() - 21, now.getMonth(), now.getDate());
    return b <= cutoff;
};
const validEmail = (s) => /.+@.+\..+/.test(String(s || ""));
const validNICorPassport = (s) => {
    const v = String(s || "").trim();
    const nicOld = /^\d{9}[VvXx]$/;
    const nicNew = /^\d{12}$/;
    const passport = /^[A-Za-z][0-9]{7}$/;
    return nicOld.test(v) || nicNew.test(v) || passport.test(v);
};

exports.upload = upload;

exports.createGuideApplication = async (req, res) => {
    try {
        const f = req.body;
        let daysAvailable = {};
        try {
            daysAvailable = f.daysAvailable ? JSON.parse(f.daysAvailable) : {};
        } catch {
            daysAvailable = {};
        }
        let languages = [];
        if (Array.isArray(f.languages)) {
            languages = f.languages;
        } else if (typeof f.languages === "string" && f.languages.trim()) {
            try {
                const parsed = JSON.parse(f.languages);
                if (Array.isArray(parsed)) languages = parsed;
                else languages = f.languages.split(",").map((s) => s.trim()).filter(Boolean);
            } catch {
                languages = f.languages.split(",").map((s) => s.trim()).filter(Boolean);
            }
        }
        const errors = {};
        if (!String(f.fullName || "").trim()) errors.fullName = "Required";
        if (!f.birthday) errors.birthday = "Required";
        else if (!is21OrOlder(f.birthday)) errors.birthday = "Must be 21+";
        if (!f.gender) errors.gender = "Required";
        if (!String(f.address || "").trim()) errors.address = "Required";
        const phone = String(f.phone || "").replace(/\D/g, "");
        if (phone.length !== 10) errors.phone = "Must be 10 digits";
        if (!validEmail(f.email)) errors.email = "Invalid email";
        if (!validNICorPassport(f.nationalIdOrPassport)) errors.nationalIdOrPassport = "Invalid NIC/Passport";
        if (!String(f.emergencyContactName || "").trim()) errors.emergencyContactName = "Required";
        const emergencyPhone = String(f.emergencyContactPhone || "").replace(/\D/g, "");
        if (emergencyPhone.length !== 10) errors.emergencyContactPhone = "Must be 10 digits";
        if (!["full-time", "part-time"].includes(f.availabilityType)) errors.availabilityType = "Select full-time or part-time";
        if (f.rateUnit && !["per_day", "per_hour"].includes(f.rateUnit)) errors.rateUnit = "Invalid rate unit";
        if (f.experienceYears !== undefined && f.experienceYears !== "") {
            const n = Number(f.experienceYears);
            if (!Number.isFinite(n) || n < 0 || n > 60) errors.experienceYears = "0 - 60";
        }
        if (f.expectedRate !== undefined && f.expectedRate !== "") {
            const n = Number(f.expectedRate);
            if (!Number.isFinite(n) || n <= 0) errors.expectedRate = "Enter a positive number";
        }
        if (Object.keys(errors).length) {
            if (req.file?.path) fs.unlink(req.file.path, () => {});
            return res.status(400).json(badReq(errors));
        }
        const doc = await GuideApplication.create({
            fullName: String(f.fullName).trim(),
            birthday: new Date(f.birthday),
            gender: f.gender,
            address: String(f.address).trim(),
            phone,
            email: String(f.email).trim().toLowerCase(),
            profilePhotoUrl: req.file ? `/uploads/${path.basename(req.file.path)}` : "",
            experienceYears:
                f.experienceYears === "" || f.experienceYears === undefined ? null : Number(f.experienceYears),
            education: String(f.education || "").trim(),
            languages,
            availabilityType: f.availabilityType,
            daysAvailable: {
                mon: !!daysAvailable.mon,
                tue: !!daysAvailable.tue,
                wed: !!daysAvailable.wed,
                thu: !!daysAvailable.thu,
                fri: !!daysAvailable.fri,
                sat: !!daysAvailable.sat,
                sun: !!daysAvailable.sun,
            },
            expectedRate:
                f.expectedRate === "" || f.expectedRate === undefined ? null : Number(f.expectedRate),
            rateUnit: f.rateUnit || "per_day",
            nationalIdOrPassport: String(f.nationalIdOrPassport).trim(),
            guideLicenseNo: String(f.guideLicenseNo || "").trim(),
            emergencyContactName: String(f.emergencyContactName).trim(),
            emergencyContactPhone: emergencyPhone,
            // Default status is "pending"
            status: "pending"
        });
        res.status(201).json({ id: doc._id.toString() });
    } catch (err) {
        console.error("Create guide application failed:", err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.listGuideApplications = async (req, res) => {
    try {
        const { q = "", page = "1", limit = "18", status } = req.query;
        const lim = Math.min(Math.max(parseInt(limit, 10) || 18, 1), 100);
        const pg = Math.max(parseInt(page, 10) || 1, 1);
        const skip = (pg - 1) * lim;
        
        // Build filter
        const filter = {};
        
        // Search filter
        if (q) {
            filter.$or = [
                { fullName: { $regex: q, $options: "i" } },
                { languages: { $regex: q, $options: "i" } },
                { guideLicenseNo: { $regex: q, $options: "i" } },
            ];
        }
        
        // Status filter
        if (status && ["pending", "approved", "rejected"].includes(status)) {
            filter.status = status;
        }

        const [items, total] = await Promise.all([
            GuideApplication.find(filter)
                .select("fullName email phone availabilityType createdAt profilePhotoUrl languages")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(lim)
                .lean(),
            GuideApplication.countDocuments(filter),
        ]);
        res.json({ items, total, page: pg, pages: Math.ceil(total / lim) });
    } catch (err) {
        console.error("List guide applications failed:", err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getGuideApplication = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }
        const doc = await GuideApplication.findById(id).lean();
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json(doc);
    } catch (err) {
        console.error("Get guide application failed:", err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.updateGuideApplication = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });
        const f = req.body;
        let daysAvailable = {};
        try { daysAvailable = f.daysAvailable ? JSON.parse(f.daysAvailable) : {}; } catch {}
        let languages = [];
        if (Array.isArray(f.languages)) languages = f.languages;
        else if (typeof f.languages === "string" && f.languages.trim()) {
            try {
                const parsed = JSON.parse(f.languages);
                languages = Array.isArray(parsed) ? parsed : f.languages.split(",").map(s=>s.trim()).filter(Boolean);
            } catch {
                languages = f.languages.split(",").map(s=>s.trim()).filter(Boolean);
            }
        }
        const errors = {};
        if (!String(f.fullName||"").trim()) errors.fullName = "Required";
        if (!f.birthday) errors.birthday = "Required";
        else {
            const b = new Date(f.birthday);
            const now = new Date();
            const cutoff = new Date(now.getFullYear()-21, now.getMonth(), now.getDate());
            if (!(b <= cutoff)) errors.birthday = "Must be 21+";
        }
        if (!f.gender) errors.gender = "Required";
        if (!String(f.address||"").trim()) errors.address = "Required";
        const phone = String(f.phone||"").replace(/\D/g, "");
        if (phone.length !== 10) errors.phone = "Must be 10 digits";
        if (!/.+@.+\..+/.test(String(f.email||""))) errors.email = "Invalid email";
        const nicOld = /^\d{9}[VvXx]$/; const nicNew = /^\d{12}$/; const passport = /^[A-Za-z][0-9]{7}$/;
        const idp = String(f.nationalIdOrPassport||"").trim();
        if (!(nicOld.test(idp) || nicNew.test(idp) || passport.test(idp))) errors.nationalIdOrPassport = "Invalid NIC/Passport";
        if (!String(f.emergencyContactName||"").trim()) errors.emergencyContactName = "Required";
        const emergencyPhone = String(f.emergencyContactPhone||"").replace(/\D/g, "");
        if (emergencyPhone.length !== 10) errors.emergencyContactPhone = "Must be 10 digits";
        if (!["full-time","part-time"].includes(f.availabilityType)) errors.availabilityType = "Select full-time or part-time";
        if (f.rateUnit && !["per_day","per_hour"].includes(f.rateUnit)) errors.rateUnit = "Invalid rate unit";
        if (f.experienceYears !== undefined && f.experienceYears !== "") {
            const n = Number(f.experienceYears);
            if (!Number.isFinite(n) || n < 0 || n > 60) errors.experienceYears = "0 - 60";
        }
        if (f.expectedRate !== undefined && f.expectedRate !== "") {
            const n = Number(f.expectedRate);
            if (!Number.isFinite(n) || n <= 0) errors.expectedRate = "Enter a positive number";
        }
        if (Object.keys(errors).length) {
            if (req.file?.path) fs.unlink(req.file.path, () => {});
            return res.status(400).json({ errors });
        }
        const oldDoc = await GuideApplication.findById(id);
        if (!oldDoc) {
            if (req.file?.path) fs.unlink(req.file.path, () => {});
            return res.status(404).json({ error: "Not found" });
        }
        let profilePhotoUrl = oldDoc.profilePhotoUrl;
        if (req.file) {
            if (oldDoc.profilePhotoUrl?.startsWith("/uploads/")) {
                const oldFilename = oldDoc.profilePhotoUrl.replace(/^\/uploads\//, "");
                const oldPath = path.join(__dirname, "..", "uploads", oldFilename);
                fs.existsSync(oldPath) && fs.unlink(oldPath, () => {});
            }
            profilePhotoUrl = `/uploads/${path.basename(req.file.path)}`;
        }
        const updated = await GuideApplication.findByIdAndUpdate(
            id,
            {
                fullName: String(f.fullName).trim(),
                birthday: new Date(f.birthday),
                gender: f.gender,
                address: String(f.address).trim(),
                phone,
                email: String(f.email).trim().toLowerCase(),
                profilePhotoUrl,
                experienceYears: f.experienceYears === "" || f.experienceYears === undefined ? null : Number(f.experienceYears),
                education: String(f.education||"").trim(),
                languages,
                availabilityType: f.availabilityType,
                daysAvailable: {
                    mon: !!daysAvailable.mon, tue: !!daysAvailable.tue, wed: !!daysAvailable.wed,
                    thu: !!daysAvailable.thu, fri: !!daysAvailable.fri, sat: !!daysAvailable.sat, sun: !!daysAvailable.sun,
                },
                expectedRate: f.expectedRate === "" || f.expectedRate === undefined ? null : Number(f.expectedRate),
                rateUnit: f.rateUnit || "per_day",
                nationalIdOrPassport: idp,
                guideLicenseNo: String(f.guideLicenseNo||"").trim(),
                emergencyContactName: String(f.emergencyContactName).trim(),
                emergencyContactPhone: emergencyPhone,
            },
            { new: true, runValidators: false, lean: true }
        );
        return res.json(updated);
    } catch (err) {
        console.error("Update guide application failed:", err);
        return res.status(500).json({ error: "Server error" });
    }
};

exports.deleteGuideApplication = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });
        const doc = await GuideApplication.findById(id);
        if (!doc) return res.status(404).json({ error: "Not found" });
        if (doc.profilePhotoUrl?.startsWith("/uploads/")) {
            const filename = doc.profilePhotoUrl.replace(/^\/uploads\//, "");
            const filePath = path.join(__dirname, "..", "uploads", filename);
            fs.existsSync(filePath) && fs.unlink(filePath, () => {});
        }
        await GuideApplication.deleteOne({ _id: id });
        return res.json({ ok: true });
    } catch (err) {
        console.error("Delete guide application failed:", err);
        return res.status(500).json({ error: "Server error" });
    }
};

// New function: Approve guide application
exports.approveGuideApplication = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid application ID" });
        }

        const application = await GuideApplication.findById(id);
        if (!application) {
            return res.status(404).json({ error: "Application not found" });
        }

        // Update status to approved and set approval timestamp
        const updatedApplication = await GuideApplication.findByIdAndUpdate(
            id,
            { 
                status: "approved",
                approvedAt: new Date(),
                // If you have user authentication, you can set approvedBy: req.user._id
            },
            { new: true }
        );

        res.json({ 
            message: "Application approved successfully",
            application: updatedApplication 
        });
    } catch (err) {
        console.error("Approve guide application failed:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// New function: Reject guide application
exports.rejectGuideApplication = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid application ID" });
        }

        const application = await GuideApplication.findById(id);
        if (!application) {
            return res.status(404).json({ error: "Application not found" });
        }

        // Update status to rejected
        const updatedApplication = await GuideApplication.findByIdAndUpdate(
            id,
            { status: "rejected" },
            { new: true }
        );

        res.json({ 
            message: "Application rejected successfully",
            application: updatedApplication 
        });
    } catch (err) {
        console.error("Reject guide application failed:", err);
        res.status(500).json({ error: "Server error" });
    }
};