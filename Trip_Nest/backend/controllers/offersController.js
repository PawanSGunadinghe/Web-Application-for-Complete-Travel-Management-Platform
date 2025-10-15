const mongoose = require("mongoose");
const Offer = require("../models/Offer");
const Package = require("../models/Package");

exports.createOffer = async (req, res) => {
    try {
        const { name, description, startDate, endDate, discountPercent, packageIds } = req.body;
        if (!name || !startDate || !endDate || discountPercent == null) {
            return res.status(400).json({ error: "name, startDate, endDate, discountPercent are required" });
        }
        if (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 100) {
            return res.status(400).json({ error: "discountPercent must be a whole number between 1 and 100" });
        }
        const offer = await Offer.create({ name, description, startDate, endDate, discountPercent });
        if (Array.isArray(packageIds) && packageIds.length) {
            await Package.updateMany(
                { _id: { $in: packageIds } },
                { $set: { promotion: offer._id } }
            );
        }
        res.status(201).json(offer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create offer" });
    }
};

exports.listOffers = async (_req, res) => {
    try {
        const items = await Offer.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: "Failed to list offers" });
    }
};

exports.getOffer = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
        const offer = await Offer.findById(req.params.id);
        if (!offer) return res.status(404).json({ error: "Not found" });
        res.json(offer);
    } catch (err) {
        res.status(500).json({ error: "Failed to load offer" });
    }
};

exports.updateOffer = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
        const { name, description, startDate, endDate, discountPercent } = req.body;
        
        if (discountPercent !== undefined && (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 100)) {
            return res.status(400).json({ error: "discountPercent must be a whole number between 1 and 100" });
        }
        
        const updated = await Offer.findByIdAndUpdate(
            req.params.id,
            { name, description, startDate, endDate, discountPercent },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ error: "Not found" });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Failed to update offer" });
    }
};

exports.deleteOffer = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
        const deleted = await Offer.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Not found" });
        await Package.updateMany({ promotion: req.params.id }, { $set: { promotion: null } });
        res.json({ ok: true, deletedId: req.params.id });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete offer" });
    }
};

exports.assignOffer = async (req, res) => {
    try {
        const { offerId, packageId } = req.params;
        if (!mongoose.isValidObjectId(offerId) || !mongoose.isValidObjectId(packageId)) {
            return res.status(400).json({ error: "Invalid id(s)" });
        }
        const offer = await Offer.findById(offerId);
        if (!offer) return res.status(404).json({ error: "Offer not found" });
        const pkg = await Package.findByIdAndUpdate(packageId, { $set: { promotion: offerId } }, { new: true })
            .populate("promotion");
        if (!pkg) return res.status(404).json({ error: "Package not found" });
        res.json(pkg);
    } catch (err) {
        res.status(500).json({ error: "Failed to assign offer" });
    }
};

exports.unassignOffer = async (req, res) => {
    try {
        const { offerId, packageId } = req.params;
        if (!mongoose.isValidObjectId(offerId) || !mongoose.isValidObjectId(packageId)) {
            return res.status(400).json({ error: "Invalid id(s)" });
        }
        const pkg = await Package.findOneAndUpdate(
            { _id: packageId, promotion: offerId },
            { $set: { promotion: null } },
            { new: true }
        ).populate("promotion");
        if (!pkg) return res.status(404).json({ error: "Package not found or not assigned" });
        res.json(pkg);
    } catch (err) {
        res.status(500).json({ error: "Failed to unassign offer" });
    }
};
