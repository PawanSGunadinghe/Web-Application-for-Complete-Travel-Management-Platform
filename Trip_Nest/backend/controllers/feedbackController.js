const Feedback = require("../models/Feedback");
const User = require("../models/User");

// GET /api/feedbacks?limit=20&page=1&q=word&sort=new|top
exports.list = async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 20, 50);
        const page = Math.max(Number(req.query.page) || 1, 1);
        const skip = (page - 1) * limit;
        const q = (req.query.q || "").trim();
        const sort = req.query.sort === "top" ? { rating: -1, createdAt: -1 } : { createdAt: -1 };

        const find = q
        ? {
            $or: [
                { title: { $regex: q, $options: "i" } },
                { body: { $regex: q, $options: "i" } },
                { userName: { $regex: q, $options: "i" } },
                { category: { $regex: q, $options: "i" } },
            ],
            }
        : {};

        const [items, total, stat] = await Promise.all([
        Feedback.find(find)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate("user", "name")
            .lean(),
        Feedback.countDocuments(find),
        Feedback.aggregate([{ $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }]),
        ]);

        res.json({ items, total, page, pages: Math.ceil(total / limit), avgRating: stat?.[0]?.avg ?? 0 });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to load feedback" });
    }
};

// GET /api/feedbacks/:id
exports.getOne = async (req, res) => {
    try {
        const item = await Feedback.findById(req.params.id).populate("user", "name").lean();
        if (!item) return res.status(404).json({ error: "Not found" });
        res.json(item);
    } catch {
        res.status(400).json({ error: "Invalid id" });
    }
};

// POST /api/feedbacks  (auth required)
exports.create = async (req, res) => {
    try {
        const { title = "", body = "", rating, category = "general", wouldBookAgain, safetyExperience, suggestions = "" } = req.body;
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Rating 1–5 required" });

        const me = await User.findById(req.user.sub).select("name");
        if (!me) return res.status(401).json({ error: "Unauthorized" });

        const doc = await Feedback.create({
        user: me._id,
        userName: me.name,
        title: String(title).trim(),
        body: String(body).trim(),
        rating: Number(rating),
        category: String(category).trim(),
        wouldBookAgain: wouldBookAgain || null,
        safetyExperience: safetyExperience || null,
        suggestions: String(suggestions).trim(),
        });

        res.status(201).json({ id: doc._id });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Create failed" });
    }
};

// PATCH /api/feedbacks/:id  (auth required)
exports.update = async (req, res) => {
    try {
        const fb = await Feedback.findById(req.params.id);
        if (!fb) return res.status(404).json({ error: "Not found" });

        const isOwner = String(fb.user || "") === String(req.user.sub);
        const isAdmin = Array.isArray(req.user?.roles) && req.user.roles.includes("admin");
        if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });

        const { title, body, rating, category, wouldBookAgain, safetyExperience, suggestions } = req.body;
        if (rating != null && (rating < 1 || rating > 5)) return res.status(400).json({ error: "Rating 1–5" });

        if (title != null) fb.title = String(title).trim();
        if (body != null) fb.body = String(body).trim();
        if (rating != null) fb.rating = Number(rating);
        if (category != null) fb.category = String(category).trim();
        if (wouldBookAgain != null) fb.wouldBookAgain = wouldBookAgain || null;
        if (safetyExperience != null) fb.safetyExperience = safetyExperience || null;
        if (suggestions != null) fb.suggestions = String(suggestions).trim();
        if (category === "") fb.category = "general";
        fb.lastModified = new Date();
        await fb.save();
        res.json({ ok: true });
    } catch {
        res.status(400).json({ error: "Update failed" });
    }
};

// DELETE /api/feedbacks/:id  (auth required)
exports.remove = async (req, res) => {
    try {
        const fb = await Feedback.findById(req.params.id);
        if (!fb) return res.status(404).json({ error: "Not found" });
        const isOwner = String(fb.user || "") === String(req.user.sub);
        const isAdmin = Array.isArray(req.user?.roles) && req.user.roles.includes("admin");
        if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });
        await fb.deleteOne();
        res.json({ ok: true });
    } catch {
        res.status(400).json({ error: "Delete failed" });
    }
};
