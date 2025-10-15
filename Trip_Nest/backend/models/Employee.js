const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    type: { type: String, enum: ["driver", "guide"], required: true },
    code: { type: String, index: true, sparse: true }, // non-unique
    phone: String,
  },
  { timestamps: true }
);

// No refId field, no unique indexes here.
module.exports = mongoose.model("Employee", EmployeeSchema);
