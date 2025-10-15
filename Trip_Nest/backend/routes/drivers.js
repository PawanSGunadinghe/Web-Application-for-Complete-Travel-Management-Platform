// routes/drivers.js
const express = require("express");
const router = express.Router();
const driversController = require("../controllers/driversController");

router.post("/", driversController.createDriver);
router.get("/", driversController.listDrivers);
router.get("/:id", driversController.getDriver);
router.put("/:id", driversController.updateDriver);
router.delete("/:id", driversController.deleteDriver);

module.exports = router;
