const mongoose = require("mongoose");

const OfferSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },                 // Promotion name
        description: { type: String, default: "", trim: true },             // Short description
        startDate: { type: Date, required: true },                           // Promotion start date
        endDate: { type: Date, required: true },                             // Promotion end date
        discountPercent: { type: Number, required: true, min: 0, max: 100 }, // % discount
        // Optional: attach image/banner later if you want
    },
    { timestamps: true }
    );

    OfferSchema.methods.isActiveNow = function () {
    const now = new Date();
    return this.startDate <= now && now <= this.endDate;
};

module.exports = mongoose.model("Offer", OfferSchema);
