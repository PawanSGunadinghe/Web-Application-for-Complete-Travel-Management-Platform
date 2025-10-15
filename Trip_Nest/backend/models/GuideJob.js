// models/GuideJob.js
const mongoose = require("mongoose");

const GuideJobSchema = new mongoose.Schema(
    {
        title: { type: String, trim: true, default: "" },
        position: { type: String, trim: true, default: "" },
        description: { type: String, trim: true, default: "" },
        contact: { type: String, required: true }, // keep as string to preserve leading 0
        deadline: { type: Date, required: true },
        salary: { type: Number, default: null },
        duration: { type: String, trim: true, default: "" },
        requirements: { type: String, trim: true, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("GuideJob", GuideJobSchema);
