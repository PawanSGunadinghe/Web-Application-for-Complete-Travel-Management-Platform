const { Types } = require("mongoose");
const Booking = require("../models/Booking");
const Package = require("../models/Package");

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const onlyDigits = (s) => String(s || "").replace(/\D/g, "");
const isAdmin = (u) => Array.isArray(u?.roles) && u.roles.includes("admin");

//export create booking
exports.createBooking = async (req, res, next) => {
    try {
        const { packageId, qty, customer, pricing, payment } = req.body || {};
        if (!packageId) return res.status(400).json({ error: "packageId required" });
        if (!Types.ObjectId.isValid(packageId)) {
            return res.status(400).json({ error: "Invalid packageId" });
        }

        const pkg = await Package.findById(packageId).lean();
        if (!pkg) return res.status(404).json({ error: "Package not found" });
        const q = Number(qty || 0);
        if (!Number.isFinite(q) || q < 1) {
            return res.status(400).json({ error: "Invalid qty" });
        }

        if (q > Number(pkg.maxTourist || 10)) {
            return res.status(400).json({ error: "Quantity exceeds package limit" });
        }
        
        const c = customer || {};
        const errors = {};
        if (!String(c.firstName || "").trim()) errors.firstName = "Required";
        if (!String(c.lastName || "").trim()) errors.lastName = "Required";
        if (!EMAIL_RX.test(String(c.email || "").trim())) errors.email = "Enter a valid email";
        
        if (!String(c.country || "").trim()) errors.country = "Select a valid country";
        const e164 = onlyDigits(c.phoneCode) + onlyDigits(c.phone);
        
        if (e164.length < 6 || e164.length > 15) errors.phone = "Enter a valid phone number";
        
        if (Object.keys(errors).length) return res.status(400).json({ errors });
        const unit = Number(pkg.price || 0);
        const subtotal = unit * q;
        const svc = subtotal * 0.10;  //service charge
        const city = subtotal * 0.01;
        const taxes = svc + city;
        const total = subtotal + taxes;
        const pay = payment || {};
        
        
        const packageSnapshot = {
            _id: pkg._id,
            name: pkg.name,
            startDate: pkg.startDate,
            endDate: pkg.endDate,
            price: pkg.price,
            maxTourist: pkg.maxTourist,
            imageUrls: Array.isArray(pkg.imageUrls) ? pkg.imageUrls : [],
        };
        
        const doc = await Booking.create({
            user: req.user.sub,
            package: pkg._id,
            packageSnapshot,
            qty: q,
            customer: {
                firstName: c.firstName,
                lastName: c.lastName,
                email: String(c.email || "").toLowerCase(),
                country: c.country,
                phoneCode: c.phoneCode,
                phone: c.phone,
                paperless: !!c.paperless,
                bookingFor: c.bookingFor || "me",
                workTrip: c.workTrip || "no",
                requests: c.requests || "",
            },
            pricing: {
                price: unit,
                qty: q,
                subtotal, svc, city, taxes, total,
                currency: "USD",
            },
            payment: {
                brand: String(pay.brand || "unknown").toLowerCase(),
                last4: String(pay.last4 || "").slice(-4),
                expMonth: Number(pay.expMonth || 0),
                expYear: Number(pay.expYear || 0),
                saveCard: !!pay.saveCard,
                marketingOptIn: !!pay.marketingOptIn,
                status: "pending",
            },
            status: "created",
        });
        
        // Emit real-time update
        req.app.get('io').emit('financeUpdate');
        return res.status(201).json({ id: doc._id.toString() });
    } catch (err) {
        console.error("Create booking failed:", err);
        next(err);
    }
};

exports.getMyBookings = async (req, res, next) => {
    try {
        const items = await Booking.find({ user: req.user.sub })
            .sort({ createdAt: -1 })
            .populate("package", "name startDate endDate price imageUrls")
            .lean();
        return res.json(items);
    } catch (err) {
        next(err);
    }
};

exports.listBookings = async (req, res, next) => {
    try {
        const admin = isAdmin(req.user);
        const showAll = admin && String(req.query.all) === "1";
        const filter = showAll ? {} : { user: req.user.sub };
        const items = await Booking.find(filter)
            .sort({ createdAt: -1 })
            .populate("package", "name startDate endDate price imageUrls")
            .lean();
        return res.json(items);
    } catch (err) {
        next(err);
    }
};

exports.listAllBookings = async (req, res, next) => {
    try {
        if (!isAdmin(req.user)) return res.status(403).json({ error: "Forbidden" });
        const items = await Booking.find({})
            .sort({ createdAt: -1 })
            .populate("package", "name startDate endDate price imageUrls")
            .lean();
        return res.json(items);
    } catch (err) {
        next(err);
    }
};

exports.getUserBookings = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid user id" });
        }
        const self = String(req.user.sub) === String(id);
        if (!self && !isAdmin(req.user)) return res.status(403).json({ error: "Forbidden" });
        const items = await Booking.find({ user: id })
            .sort({ createdAt: -1 })
            .populate("package", "name startDate endDate price imageUrls")
            .lean();
        return res.json(items);
    } catch (err) {
        next(err);
    }
};

exports.getBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }
        const b = await Booking.findById(id)
            .populate("package", "name startDate endDate price imageUrls")
            .lean();
        if (!b) return res.status(404).json({ error: "Not found" });
        const owner = String(b.user) === String(req.user.sub);
        if (!owner && !isAdmin(req.user)) return res.status(403).json({ error: "Forbidden" });
        return res.json(b);
    } catch (err) {
        next(err);
    }
};

exports.updateBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }
        const b = await Booking.findById(id).populate("package", "price maxTourist startDate endDate imageUrls name");
        if (!b) return res.status(404).json({ error: "Not found" });
        const owner = String(b.user) === String(req.user.sub);
        if (!owner && !isAdmin(req.user)) return res.status(403).json({ error: "Forbidden" });
        const errors = {};
        const body = req.body || {};
        if (body.customer) {
            const c = body.customer;
            if (typeof c.email !== "undefined") {
                const e = String(c.email || "").trim();
                if (!EMAIL_RX.test(e)) errors.email = "Enter a valid email";
                else b.customer.email = e.toLowerCase();
            }
            if (typeof c.phone !== "undefined") {
                const dial = onlyDigits(b.customer?.phoneCode || "");
                const local = onlyDigits(c.phone || "");
                const e164 = dial + local;
                if (local.length === 0 || e164.length < 6 || e164.length > 15) {
                    errors.phone = "Enter a valid phone number";
                } else {
                    b.customer.phone = local;
                }
            }
            if (typeof c.requests !== "undefined") {
                b.customer.requests = String(c.requests || "");
            }
        }
        
        if (typeof body.qty !== "undefined") {
            const q = Number(body.qty);
            if (!Number.isFinite(q) || q < 1) {
                errors.qty = "Quantity must be at least 1";
            } else {
                const max = Number(b.package?.maxTourist ?? b.packageSnapshot?.maxTourist ?? 10);
                if (q > max) {
                    errors.qty = `Quantity exceeds package limit (${max})`;
                } else {
                    const unit = Number(b.package?.price ?? b.packageSnapshot?.price ?? 0);
                    const subtotal = unit * q;
                    const svc = subtotal * 0.10;
                    const city = subtotal * 0.01;
                    const taxes = svc + city;
                    const total = subtotal + taxes;
                    b.qty = q;
                    b.pricing = {
                        price: unit,
                        qty: q,
                        subtotal, svc, city, taxes, total,
                        currency: b.pricing?.currency || "USD",
                    };
                }
            }
        }
        if (Object.keys(errors).length) return res.status(400).json({ errors });
        await b.save();
        const updated = await Booking.findById(id)
            .populate("package", "name startDate endDate price imageUrls")
            .lean();
        return res.json(updated);
    } catch (err) {
        next(err);
    }
};

// update assignment (admin only)
exports.updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { assignedGuideId, assignedVehicleIds, assignmentNotes } = req.body || {};
        
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }
        
        const GuideApplication = require("../models/GuideApplication");
        const Vehicle = require("../models/Vehicle");
        
        let guideId = null;
        if (assignedGuideId) {
            if (!Types.ObjectId.isValid(assignedGuideId)) {
                return res.status(400).json({ error: "Invalid guide id" });
            }
            const g = await GuideApplication.findById(assignedGuideId).select("_id").lean();
            if (!g) return res.status(404).json({ error: "Guide not found" });
            guideId = g._id;
        }
        
        let vehicleIds = [];
        if (Array.isArray(assignedVehicleIds) && assignedVehicleIds.length > 0) {
            const vs = await Vehicle.find({ _id: { $in: assignedVehicleIds } }).select("_id").lean();
            vehicleIds = vs.map((v) => v._id);
        }
        
        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ error: "Not found" });
        
        if (assignedGuideId !== undefined) booking.assignedGuideId = guideId;
        if (assignedVehicleIds !== undefined) booking.assignedVehicleIds = vehicleIds;
        if (assignmentNotes !== undefined) booking.assignmentNotes = String(assignmentNotes || "");
        
        if (guideId || vehicleIds.length > 0) {
            booking.assignedAt = booking.assignedAt || new Date();
        }
        
        await booking.save();
        
        const updated = await Booking.findById(id)
            .populate("package", "name startDate endDate price imageUrls")
            .populate("assignedGuideId")
            .populate("assignedVehicleIds")
            .lean();
            
        return res.json(updated);
    } catch (err) {
        console.error("update assignment error:", err);
        return res.status(500).json({ error: "Failed to update assignment" });
    }
};

//delete
exports.deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }
        const b = await Booking.findById(id);
        if (!b) return res.status(404).json({ error: "Not found" });
        const owner = String(b.user) === String(req.user.sub || req.user._id);
        if (!owner && !isAdmin?.(req.user)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        await b.deleteOne();
        return res.json({ ok: true });
    } catch (err) {
        console.error("delete booking error:", err);
        return res.status(500).json({ error: "Failed to delete booking" });
    }
};
