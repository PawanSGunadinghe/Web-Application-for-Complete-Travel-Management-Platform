// controllers/financeController.js
const Booking = require("../models/Booking");
const Salary = require("../models/Salary");

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function computeSalaryMonthlyAmount(s) {
  const base = Number(s.base || 0);
  let total = base;
  if (Array.isArray(s.components)) {
    for (const c of s.components) {
      const fixed = c.amount != null ? Number(c.amount) : 0;
      const pct = c.percentageOfBase != null ? Number(c.percentageOfBase) : 0;
      const amount = fixed + (pct ? (base * pct) / 100 : 0);
      total += c.type === "deduction" ? -amount : amount;
    }
  }
  return Math.max(0, Number(total || 0));
}

// GET /api/finance/summary
exports.summary = async (req, res) => {
  try {
    const now = new Date();
    const fromParam = req.query.from ? new Date(req.query.from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toParam = req.query.to ? new Date(req.query.to) : now;

    const from = startOfDay(fromParam);
    const to = endOfDay(toParam);

    // Income: sum booking.pricing.total for all bookings
    // If requesting all-time data (from 1970), calculate from ALL bookings regardless of date or status
    let incomeAgg;
    if (fromParam.getFullYear() <= 1970) {
      // All-time calculation - include ALL bookings regardless of date or status
      incomeAgg = await Booking.aggregate([
        { $match: {} }, // No filtering - include ALL bookings
        { $group: { _id: null, total: { $sum: "$pricing.total" } } },
      ]);
    } else {
      // Date-filtered calculation for specific periods (still filter by confirmed for regular reports)
      incomeAgg = await Booking.aggregate([
        { $match: { status: "confirmed", createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: null, total: { $sum: "$pricing.total" } } },
      ]);
    }
    const totalIncome = incomeAgg[0]?.total || 0;

    // Expense: sum of monthly salary amounts whose effective range overlaps [from, to]
    const salaries = await Salary.find({
      $or: [
        { effectiveTo: null, effectiveFrom: { $lte: to } },
        { effectiveTo: { $gte: from }, effectiveFrom: { $lte: to } },
      ],
    }).lean();

    const monthlyExpense = salaries.reduce((acc, s) => acc + computeSalaryMonthlyAmount(s), 0);
    const totalExpenses = monthlyExpense;

    // Build daily income series
    const days = [];
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }

    let dailyIncomeAgg;
    if (fromParam.getFullYear() <= 1970) {
      // All-time calculation - get ALL bookings grouped by date
      dailyIncomeAgg = await Booking.aggregate([
        { $match: {} }, // No filtering - include ALL bookings
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, amount: { $sum: "$pricing.total" } } },
        { $sort: { _id: 1 } },
      ]);
    } else {
      // Date-filtered calculation
      dailyIncomeAgg = await Booking.aggregate([
        { $match: { status: "confirmed", createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, amount: { $sum: "$pricing.total" } } },
        { $sort: { _id: 1 } },
      ]);
    }
    const incomeMap = new Map(dailyIncomeAgg.map(r => [r._id, r.amount]));

    const incomeSeries = days.map(d => {
      const key = d.toISOString().slice(0, 10);
      return { date: key, amount: Number(incomeMap.get(key) || 0) };
    });

    // Approximate expense as even daily spread of monthly expense across the selected period
    const dayCount = Math.max(1, incomeSeries.length);
    const perDayExpense = totalExpenses / dayCount;
    const expenseSeries = incomeSeries.map(i => ({ date: i.date, amount: Number(perDayExpense) }));

    const totalBalance = Number(totalIncome - totalExpenses);

    res.json({
      summary: {
        totalIncome: Number(totalIncome),
        totalExpenses: Number(totalExpenses),
        totalBalance: Number(totalBalance),
      },
      charts: {
        incomeSeries,
        expenseSeries,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to load finance summary" });
  }
};

// GET /api/finance/expenses
// Returns a list of expense items for the selected period. Currently includes salaries by employee.
exports.expenses = async (req, res) => {
  try {
    const now = new Date();
    const fromParam = req.query.from ? new Date(req.query.from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toParam = req.query.to ? new Date(req.query.to) : now;

    const from = startOfDay(fromParam);
    const to = endOfDay(toParam);

    const salaries = await Salary.find({
      $or: [
        { effectiveTo: null, effectiveFrom: { $lte: to } },
        { effectiveTo: { $gte: from }, effectiveFrom: { $lte: to } },
      ],
    })
      .populate("employee")
      .lean();

    const items = salaries.map((s) => ({
      id: String(s._id),
      type: "salary",
      employeeName: s.employee?.fullName || "Employee",
      currency: s.currency || "USD",
      amount: computeSalaryMonthlyAmount(s),
      effectiveFrom: s.effectiveFrom,
      effectiveTo: s.effectiveTo || null,
    }));

    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to load expenses" });
  }
};


