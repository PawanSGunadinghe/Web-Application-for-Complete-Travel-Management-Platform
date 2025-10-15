const mongoose = require("mongoose");
const { Schema } = mongoose;

const ComponentSchema = new Schema(
  {
    type: { type: String, enum: ["earning", "deduction"], default: "earning" },
    name: { type: String, trim: true, required: true },
    amount: { type: Number, min: 0 },
    percentageOfBase: { type: Number, min: 0 },
  },
  { _id: false }
);

const VehicleSalarySchema = new Schema(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },

    currency: { type: String, default: "USD", trim: true },
    base: { type: Number, min: 0, required: true },

    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date },

    notes: { type: String, trim: true },

    components: { type: [ComponentSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VehicleSalary", VehicleSalarySchema);
