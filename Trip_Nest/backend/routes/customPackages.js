// routes/customPackages.js
const express = require("express");
const router = express.Router();
const customPackagesController = require("../controllers/customPackagesController");

router.post("/", customPackagesController.createCustomPackage);
router.get("/", customPackagesController.listCustomPackages);
router.get("/:id", customPackagesController.getCustomPackage);
router.put("/:id", customPackagesController.updateCustomPackage);
router.patch("/:id", customPackagesController.updateStatus);
router.patch("/:id/assignment", customPackagesController.updateAssignment);
router.delete("/:id", customPackagesController.deleteCustomPackage);

module.exports = router;
