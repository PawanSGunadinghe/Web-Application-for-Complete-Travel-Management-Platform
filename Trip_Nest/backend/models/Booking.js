const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema({
    firstName: { type: String, trim: true, required: true },
    lastName:  { type: String, trim: true, required: true },
    email:     { type: String, trim: true, lowercase: true, required: true },
    country:   { type: String, trim: true, required: true }, // ISO alpha-2 like 'LK'
    phoneCode: { type: String, trim: true },                  // like '+94'
    phone:     { type: String, trim: true },
    paperless: Boolean,
    bookingFor:{ type: String, enum: ["me", "someone"], default: "me" },
    workTrip:  { type: String, enum: ["yes", "no"], default: "no" },
    requests:  { type: String, trim: true }
    }, { _id: false });

    const PricingSchema = new mongoose.Schema({
    price:     { type: Number, required: true }, // unit price at time of booking
    qty:       { type: Number, required: true },
    subtotal:  { type: Number, required: true },
    svc:       { type: Number, required: true },
    city:      { type: Number, required: true },
    taxes:     { type: Number, required: true },
    total:     { type: Number, required: true },
    currency:  { type: String, default: "USD" },
    }, { _id: false });

    const PaymentSchema = new mongoose.Schema({
    brand:  { type: String, trim: true },        // "visa", "mastercard", etc.
    last4:  { type: String, trim: true },        // never store full PAN
    expMonth: Number,
    expYear:  Number,
    saveCard: Boolean,
    marketingOptIn: Boolean,
    status: { type: String, enum: ["pending","authorized","captured","requires_action","failed","free"], default: "pending" }
    }, { _id: false });

    // ⬇️ NEW: keep a small snapshot of the package at booking time (optional but useful)
    const PackageSnapshotSchema = new mongoose.Schema({
    _id:        mongoose.Schema.Types.ObjectId,
    name:       String,
    startDate:  Date,
    endDate:    Date,
    price:      Number,
    maxTourist: Number,
    imageUrls:  [String],
    }, { _id: false });

    //structure of booking info
    const BookingSchema = new mongoose.Schema({
    // ⬇️ NEW: who made the booking
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    package: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },

    // ⬇️ NEW: snapshot for faster reads 
    packageSnapshot: PackageSnapshotSchema,

    qty:     { type: Number, min: 1, required: true },
    customer: CustomerSchema,
    pricing:  PricingSchema,
    payment:  PaymentSchema,
    status:   { type: String, enum: ["created","confirmed","cancelled"], default: "created" },
    
    // Assignment fields
    assignedGuideId: { type: mongoose.Schema.Types.ObjectId, ref: "GuideApplication", default: null },
    assignedVehicleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" }],
    assignmentNotes: { type: String, default: "" },
    assignedAt: { type: Date, default: null }
    }, { timestamps: true });

module.exports = mongoose.model("Booking", BookingSchema);
