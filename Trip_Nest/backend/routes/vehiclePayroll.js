const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/vehicleSalaryController");

router.get("/vehicle-salaries", ctrl.list);
router.get("/vehicle-salaries/:id", ctrl.getOne);
router.post("/vehicle-salaries", ctrl.create);
router.put("/vehicle-salaries/:id", ctrl.update);
router.delete("/vehicle-salaries/:id", ctrl.remove);

module.exports = router;
