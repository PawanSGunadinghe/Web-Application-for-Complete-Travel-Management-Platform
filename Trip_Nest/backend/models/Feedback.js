// models/Feedback.js
const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: { type: String, required: true, trim: true },
        userAvatar: { type: String, default: "" },
        title: { type: String, trim: true, maxlength: 120 },
        body: { type: String, trim: true, maxlength: 2000 },
        rating: { type: Number, required: true, min: 1, max: 5 },
        category: { type: String, trim: true, enum: ['vehicle', 'tour_guide', 'package', 'driver', 'general'], default: 'general' },
        wouldBookAgain: { type: String, trim: true, enum: ['yes', 'no', 'maybe'], default: null },
        safetyExperience: { type: String, trim: true, enum: ['very_safe', 'safe', 'neutral', 'unsafe'], default: null },
        suggestions: { type: String, trim: true, maxlength: 1000, default: "" },
        lastModified: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ rating: -1 });

module.exports = mongoose.model("Feedback", FeedbackSchema);
