// routes/payroll.js
const express = require("express");
const router = express.Router();
const SalaryController = require("../controllers/salaryController");

// Salaries
router.get("/salaries", SalaryController.list);
router.get("/salaries/:id", SalaryController.getOne);
router.post("/salaries", SalaryController.create);
router.put("/salaries/:id", SalaryController.update);
router.delete("/salaries/:id", SalaryController.remove);

// Employees (aggregated from Drivers & Guides and mirrored as Employee docs)
router.get("/employees", SalaryController.employees);

module.exports = router;
