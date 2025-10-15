// routes/finance.js
const express = require("express");
const router = express.Router();
const FinanceController = require("../controllers/financeController");

router.get("/summary", FinanceController.summary);
router.get("/expenses", FinanceController.expenses);

module.exports = router;


