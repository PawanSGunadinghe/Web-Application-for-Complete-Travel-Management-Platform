// routes/packages.js
const express = require("express");
const router = express.Router();
const packagesController = require("../controllers/packagesController");

// Use multer middleware for file uploads
router.post("/", packagesController.upload.array("images", 12), packagesController.createPackage);
router.get("/", packagesController.listPackages);
router.get("/:id", packagesController.getPackage);
router.put("/:id", packagesController.updatePackage);
router.delete("/:id", packagesController.deletePackage);
router.use(packagesController.multerErrorHandler);

module.exports = router;
