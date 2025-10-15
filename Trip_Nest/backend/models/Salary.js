// models/Salary.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const ComponentSchema = new Schema(
  {
    type: { type: String, enum: ["earning", "deduction"], default: "earning" },
    name: { type: String, trim: true, required: true },
    amount: { type: Number, min: 0 },              // optional fixed amount
    percentageOfBase: { type: Number, min: 0 },    // optional %
  },
  { _id: false }
);

const SalarySchema = new Schema(
  {
    // 🔑 the only required link to the worker
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },

    currency: { type: String, default: "USD", trim: true },
    base: { type: Number, min: 0, required: true },

    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date },

    notes: { type: String, trim: true },

    components: { type: [ComponentSchema], default: [] },

    // 🚫 legacy fields (no longer required). Keep them non-required if you already have data.
    // employeeType: { type: String, enum: ["driver", "guide"] },
    // employeeId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Salary", SalarySchema);
