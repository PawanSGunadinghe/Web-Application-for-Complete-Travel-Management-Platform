const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["vehicle", "employee", "other"],
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  recipientName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: ""
  },
  category: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
expenseSchema.index({ recipientId: 1, date: -1 });
expenseSchema.index({ type: 1, date: -1 });
expenseSchema.index({ createdBy: 1, date: -1 });

module.exports = mongoose.model("Expense", expenseSchema);
