// routes/guideApplications.js
const express = require("express");
const router = express.Router();
const guideApplicationsController = require("../controllers/guideApplicationsController");

router.post("/", guideApplicationsController.upload.single("profilePhoto"), guideApplicationsController.createGuideApplication);
router.get("/", guideApplicationsController.listGuideApplications);
router.get("/:id", guideApplicationsController.getGuideApplication);
router.put("/:id", guideApplicationsController.upload.single("profilePhoto"), guideApplicationsController.updateGuideApplication);
router.delete("/:id", guideApplicationsController.deleteGuideApplication);

// New approval routes
router.patch("/:id/approve", guideApplicationsController.approveGuideApplication);
router.patch("/:id/reject", guideApplicationsController.rejectGuideApplication);

module.exports = router;