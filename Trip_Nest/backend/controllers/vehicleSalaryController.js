const VehicleSalary = require("../models/VehicleSalary");
const Vehicle = require("../models/Vehicle");

exports.list = async (req, res) => {
  try {
    const q = {};
    if (req.query.vehicleId) q.vehicle = req.query.vehicleId;
    const items = await VehicleSalary.find(q)
      .populate("vehicle")
      .sort({ effectiveFrom: -1, createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to list vehicle salaries" });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await VehicleSalary.findById(id).populate("vehicle").lean();
    if (!item) return res.status(404).json({ error: "Vehicle salary not found" });
    res.json({ item });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to fetch vehicle salary" });
  }
};

exports.create = async (req, res) => {
  try {
    const { vehicleId, currency, base, effectiveFrom, effectiveTo, notes, components } = req.body;
    const Vehicle = require("../models/Vehicle");
    const Salary = require("../models/Salary");
    const vehicle = await Vehicle.findById(vehicleId).lean();
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

    const doc = await Salary.create({
      vehicle: vehicleId,
      currency,
      base,
      effectiveFrom,
      effectiveTo: effectiveTo || null,
      notes: notes || "",
      components: Array.isArray(components)
        ? components.map((c) => ({
            type: c.type === "deduction" ? "deduction" : "earning",
            name: String(c.name || "").trim(),
            amount: c.amount != null ? Number(c.amount) : undefined,
            percentageOfBase: c.percentageOfBase != null ? Number(c.percentageOfBase) : undefined,
          }))
        : [],
    });

    const saved = await doc.populate("vehicle");
    try { req.app.get("io").emit("financeUpdate"); } catch (_) {}
    res.status(201).json({ id: saved._id, item: saved });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to create vehicle salary" });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { currency, base, effectiveFrom, effectiveTo, notes, components } = req.body;
    const update = {};
    if (currency !== undefined) update.currency = currency;
    if (base !== undefined) update.base = Number(base);
    if (effectiveFrom !== undefined) update.effectiveFrom = effectiveFrom;
    if (effectiveTo !== undefined) update.effectiveTo = effectiveTo || null;
    if (notes !== undefined) update.notes = notes;
    if (Array.isArray(components)) {
      update.components = components.map((c) => ({
        type: c.type === "deduction" ? "deduction" : "earning",
        name: String(c.name || "").trim(),
        amount: c.amount != null ? Number(c.amount) : undefined,
        percentageOfBase: c.percentageOfBase != null ? Number(c.percentageOfBase) : undefined,
      }));
    }
    const saved = await VehicleSalary.findByIdAndUpdate(id, update, { new: true })
      .populate("vehicle")
      .lean();
    if (!saved) return res.status(404).json({ error: "Vehicle salary not found" });
    try { req.app.get("io").emit("financeUpdate"); } catch (_) {}
    res.json({ id: saved._id, item: saved });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to update vehicle salary" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await VehicleSalary.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ error: "Vehicle salary not found" });
    try { req.app.get("io").emit("financeUpdate"); } catch (_) {}
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to delete vehicle salary" });
  }
};
