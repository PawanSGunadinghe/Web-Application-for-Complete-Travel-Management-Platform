const express = require("express");
const router = express.Router();
const providersController = require("../controllers/providersController");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/pending", requireAuth, requireRole("admin"), providersController.listPendingProviders);
router.patch("/:userId/approve", requireAuth, requireRole("admin"), providersController.approveProvider);
router.patch("/:userId/reject", requireAuth, requireRole("admin"), providersController.rejectProvider);

module.exports = router;
