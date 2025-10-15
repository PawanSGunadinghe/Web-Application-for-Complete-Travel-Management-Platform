// backend/controllers/salaryController.js
const Salary = require("../models/Salary");
const Employee = require("../models/Employee");

// Optional sources (only used to READ and build Employees on demand)
let Driver, GuideApplication;
try { Driver = require("../models/Driver"); } catch (e) {}
try { GuideApplication = require("../models/GuideApplication"); } catch (e) {}

// ---------- GET /api/payroll/salaries ----------
exports.list = async (req, res) => {
    try {
        const q = {};
        if (req.query.employeeId) q.employee = req.query.employeeId;

        const items = await Salary.find(q)
        .populate("employee")
        .sort({ effectiveFrom: -1, createdAt: -1 })
        .lean();

        res.json({ items });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || "Failed to list salaries" });
    }
    };

    // ---------- helper (Option B): create Employee from a source record ----------
    async function makeEmployeeFromSource(type, srcId) {
    type = (type || "").toLowerCase();
    if (!srcId) return null;

    if (type === "driver" && Driver) {
        const d = await Driver.findById(srcId).lean();
        if (!d) return null;
        // No refId linking — just create a simple Employee record
        const emp = await Employee.create({
        type: "driver",
        fullName: d.fullName || d.name || "Driver",
        phone: d.phone || "",
        code: d.licenseNumber || ""
        });
        return emp;
    }

    if (type === "guide" && GuideApplication) {
        const g = await GuideApplication.findById(srcId).lean();
        if (!g) return null;
        const full =
        [g.firstName, g.lastName].filter(Boolean).join(" ").trim() ||
        g.fullName ||
        g.name ||
        "Guide";
        const emp = await Employee.create({
        type: "guide",
        fullName: full,
        phone: g.phone || g.mobile || "",
        code: "" // nothing stable to store here
        });
        return emp;
    }

    return null;
    }

    // ---------- GET /api/payroll/employees ----------
    // Option B: Do NOT mirror into Employee. Just return:
    //   1) existing Employee docs,
    //   2) plus raw drivers/guides as selectable items (not saved).
    exports.employees = async (_req, res) => {
    try {
        const out = [];

        // Existing saved Employees
        const saved = await Employee.find({ archived: { $ne: true } }).lean();
        for (const e of saved) {
        out.push({
            _id: String(e._id),           // real Employee id
            type: e.type,                 // "driver" | "guide" | "staff"
            label: e.fullName,
            code: e.code || "",
            _source: "employee"           // mark as actual Employee
        });
        }

        // Raw Drivers (not persisted as Employees until first salary is created)
        if (Driver) {
        const drivers = await Driver.find({}).lean();
        for (const d of drivers) {
            out.push({
            _id: String(d._id),         // this is DRIVER id, not Employee
            type: "driver",
            label: d.fullName || d.name || "Driver",
            code: d.licenseNumber || "",
            _source: "driver"
            });
        }
        }

        // Raw Guides (not persisted until salary create)
        if (GuideApplication) {
        const guides = await GuideApplication.find({}).lean();
        for (const g of guides) {
            const full =
            [g.firstName, g.lastName].filter(Boolean).join(" ").trim() ||
            g.fullName || g.name || "Guide";
            out.push({
            _id: String(g._id),         // this is GUIDE id, not Employee
            type: "guide",
            label: full,
            code: "",
            _source: "guide"
            });
        }
        }

        res.json({ items: out });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || "Failed to load employees" });
    }
    };

    // ---------- POST /api/payroll/salaries ----------
    exports.create = async (req, res) => {
    try {
        const { employeeId, currency, base, effectiveFrom, effectiveTo, notes, components } = req.body;

        let employee = null;

        // 1) Try: employeeId is an actual Employee _id
        if (employeeId) {
        employee = await Employee.findById(employeeId);
        }

        // 2) If not found, treat employeeId as a raw source id (+ ?type=driver|guide)
        if (!employee) {
        const sourceType = (req.query.type || req.body.type || "").toLowerCase();
        employee = await makeEmployeeFromSource(sourceType, employeeId);
        }

        if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
        }

        const doc = await Salary.create({
        employee: employee._id,
        currency,
        base,
        effectiveFrom,
        effectiveTo: effectiveTo || null,
        notes: notes || "",
        components: Array.isArray(components)
            ? components.map(c => ({
                type: c.type === "deduction" ? "deduction" : "earning",
                name: String(c.name || "").trim(),
                amount: c.amount != null ? Number(c.amount) : undefined,
                percentageOfBase: c.percentageOfBase != null ? Number(c.percentageOfBase) : undefined,
            }))
            : []
        });

        const saved = await doc.populate("employee");
        // Emit real-time update
        req.app.get('io').emit('financeUpdate');
        res.status(201).json({ id: saved._id, item: saved });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || "Failed to create salary" });
    }
};

// ---------- GET /api/payroll/salaries/:id ----------
exports.getOne = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Salary.findById(id).populate("employee").lean();
        if (!item) return res.status(404).json({ error: "Salary not found" });
        res.json({ item });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || "Failed to fetch salary" });
    }
};

// ---------- PUT /api/payroll/salaries/:id ----------
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeId, currency, base, effectiveFrom, effectiveTo, notes, components } = req.body;

        const update = {};
        // Optionally change employee reference
        if (employeeId) {
            let employee = await Employee.findById(employeeId);
            if (!employee) {
                const sourceType = (req.query.type || req.body.type || "").toLowerCase();
                employee = await makeEmployeeFromSource(sourceType, employeeId);
            }
            if (!employee) return res.status(404).json({ error: "Employee not found" });
            update.employee = employee._id;
        }
        if (currency !== undefined) update.currency = currency;
        if (base !== undefined) update.base = Number(base);
        if (effectiveFrom !== undefined) update.effectiveFrom = effectiveFrom;
        if (effectiveTo !== undefined) update.effectiveTo = effectiveTo || null;
        if (notes !== undefined) update.notes = notes;
        if (Array.isArray(components)) {
            update.components = components.map(c => ({
                type: c.type === "deduction" ? "deduction" : "earning",
                name: String(c.name || "").trim(),
                amount: c.amount != null ? Number(c.amount) : undefined,
                percentageOfBase: c.percentageOfBase != null ? Number(c.percentageOfBase) : undefined,
            }));
        }

        const saved = await Salary.findByIdAndUpdate(id, update, { new: true })
            .populate("employee")
            .lean();

        if (!saved) return res.status(404).json({ error: "Salary not found" });
        // Emit real-time update
        req.app.get('io').emit('financeUpdate');
        res.json({ id: saved._id, item: saved });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || "Failed to update salary" });
    }
};

// ---------- DELETE /api/payroll/salaries/:id ----------
exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Salary.findByIdAndDelete(id).lean();
        if (!deleted) return res.status(404).json({ error: "Salary not found" });
        // Emit real-time update
        req.app.get('io').emit('financeUpdate');
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || "Failed to delete salary" });
    }
};