const mongoose = require("mongoose");
const GuideJob = require("../models/GuideJob");

const badReq = (errors) => ({ errors });
function validatePayload(body = {}, { isUpdate = false } = {}) {
    const {
        title = "",
        position = "",
        description = "",
        contact = "",
        deadline,
        salary,
        duration = "",
        requirements = "",
    } = body;
    const errs = {};
    const digits = String(contact).replace(/\D/g, "");
    if (digits.length !== 10) errs.contact = "Phone must be 10 digits";
    if (!deadline) {
        errs.deadline = "Please choose a deadline";
    } else {
        const d = new Date(deadline);
        if (Number.isNaN(d.getTime())) {
            errs.deadline = "Invalid date";
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (d < today) errs.deadline = "Deadline cannot be before today";
        }
    }
    const doc = {
        title: String(title).trim(),
        position: String(position).trim(),
        description: String(description).trim(),
        contact: digits,
        deadline: deadline ? new Date(deadline) : null,
        salary:
            salary === null || salary === undefined || salary === ""
                ? null
                : Number(salary),
        duration: String(duration).trim(),
        requirements: String(requirements).trim(),
    };
    return { errs, doc };
}

exports.createGuideJob = async (req, res) => {
    try {
        const { errs, doc } = validatePayload(req.body || {});
        if (Object.keys(errs).length) return res.status(400).json(badReq(errs));
        const created = await GuideJob.create(doc);
        return res.status(201).json({ id: created._id.toString() });
    } catch (err) {
        console.error("Create guide job failed:", err);
        return res.status(500).json({ error: "Server error" });
    }
};

exports.listGuideJobs = async (req, res) => {
    try {
        const { q = "", page = "1", limit = "18" } = req.query;
        const lim = Math.min(Math.max(parseInt(limit, 10) || 18, 1), 100);
        const pg = Math.max(parseInt(page, 10) || 1, 1);
        const skip = (pg - 1) * lim;
        const filter = q
            ? {
                  $or: [
                      { title: { $regex: q, $options: "i" } },
                      { position: { $regex: q, $options: "i" } },
                  ],
              }
            : {};
        const [items, total] = await Promise.all([
            GuideJob.find(filter)
                .select("title position createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(lim)
                .lean(),
            GuideJob.countDocuments(filter),
        ]);
        res.json({ items, total, page: pg, pages: Math.ceil(total / lim) });
    } catch (err) {
        console.error("List guide jobs failed:", err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getGuideJob = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }
        const job = await GuideJob.findById(id).lean();
        if (!job) return res.status(404).json({ error: "Not found" });
        res.json(job);
    } catch (err) {
        console.error("Get guide job failed:", err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.updateGuideJob = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }
        const { errs, doc } = validatePayload(req.body || {}, { isUpdate: true });
        if (Object.keys(errs).length) return res.status(400).json(badReq(errs));
        const updated = await GuideJob.findByIdAndUpdate(
            id,
            { $set: doc },
            { new: true, runValidators: true, lean: true }
        );
        if (!updated) return res.status(404).json({ error: "Not found" });
        res.json({ ok: true, id, updated });
    } catch (err) {
        console.error("Update guide job failed:", err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.deleteGuideJob = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }
        const del = await GuideJob.findByIdAndDelete(id);
        if (!del) return res.status(404).json({ error: "Not found" });
        res.json({ ok: true, id });
    } catch (err) {
        console.error("Delete guide job failed:", err);
        res.status(500).json({ error: "Server error" });
    }
};
