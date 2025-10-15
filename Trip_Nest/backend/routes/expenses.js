const express = require("express");
const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const { requireAuth, isAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/expenses - Get all expenses (admin only)
router.get("/", requireAuth, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const expenses = await Expense.find()
      .populate("recipientId", "name vehicleType numberPlate fullName")
      .populate("createdBy", "fullName email")
      .sort({ date: -1 })
      .lean();

    res.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/expenses/:id - Get single expense
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    const expense = await Expense.findById(id)
      .populate("recipientId", "name vehicleType numberPlate fullName")
      .populate("createdBy", "fullName email")
      .lean();

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/expenses - Create new expense
router.post("/", requireAuth, async (req, res) => {
  try {
    const { type, recipientId, amount, description, category, date } = req.body;

    // Validation
    if (!type || !recipientId || !amount || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!mongoose.isValidObjectId(recipientId)) {
      return res.status(400).json({ error: "Invalid recipient ID" });
    }

    // Get recipient name based on type
    let recipientName = "";
    if (type === "vehicle") {
      const vehicle = await Vehicle.findById(recipientId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      recipientName = `${vehicle.vehicleType}-${vehicle.numberPlate}`;
    } else if (type === "employee") {
      const employee = await User.findById(recipientId);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      recipientName = employee.fullName;
    }

    const expense = new Expense({
      type,
      recipientId,
      recipientName,
      amount: parseFloat(amount),
      description: description || "",
      category,
      date: date ? new Date(date) : new Date(),
      createdBy: req.user.sub
    });

    await expense.save();

    // Populate the response
    const populatedExpense = await Expense.findById(expense._id)
      .populate("recipientId", "name vehicleType numberPlate fullName")
      .populate("createdBy", "fullName email")
      .lean();

    // Notify listeners (dashboards) to refresh
    try { req.app.get('io').emit('financeUpdate'); } catch (e) {}

    res.status(201).json(populatedExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/expenses/:id - Update expense
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, recipientId, amount, description, category, date } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Update fields
    if (type) expense.type = type;
    if (recipientId) {
      if (!mongoose.isValidObjectId(recipientId)) {
        return res.status(400).json({ error: "Invalid recipient ID" });
      }
      expense.recipientId = recipientId;
      
      // Update recipient name
      let recipientName = "";
      if (type === "vehicle") {
        const vehicle = await Vehicle.findById(recipientId);
        if (!vehicle) {
          return res.status(404).json({ error: "Vehicle not found" });
        }
        recipientName = `${vehicle.vehicleType}-${vehicle.numberPlate}`;
      } else if (type === "employee") {
        const employee = await User.findById(recipientId);
        if (!employee) {
          return res.status(404).json({ error: "Employee not found" });
        }
        recipientName = employee.fullName;
      }
      expense.recipientName = recipientName;
    }
    if (amount !== undefined) expense.amount = parseFloat(amount);
    if (description !== undefined) expense.description = description;
    if (category) expense.category = category;
    if (date) expense.date = new Date(date);

    await expense.save();

    // Populate the response
    const populatedExpense = await Expense.findById(expense._id)
      .populate("recipientId", "name vehicleType numberPlate fullName")
      .populate("createdBy", "fullName email")
      .lean();

    // Notify listeners
    try { req.app.get('io').emit('financeUpdate'); } catch (e) {}

    res.json(populatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    await Expense.findByIdAndDelete(id);

    // Notify listeners
    try { req.app.get('io').emit('financeUpdate'); } catch (e) {}

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/expenses/summary - Get expense summary
router.get("/summary", requireAuth, async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { from, to } = req.query;
    const filter = {};

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const expenses = await Expense.find(filter);
    
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const categoryBreakdown = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    const typeBreakdown = expenses.reduce((acc, expense) => {
      acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
      return acc;
    }, {});

    res.json({
      totalExpenses,
      count: expenses.length,
      categoryBreakdown,
      typeBreakdown,
      expenses: expenses.slice(0, 10) // Recent 10 expenses
    });
  } catch (error) {
    console.error("Error fetching expense summary:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
