// routes/guideJobs.js
const express = require("express");
const router = express.Router();
const guideJobsController = require("../controllers/guideJobsController");

router.post("/", guideJobsController.createGuideJob);
router.get("/", guideJobsController.listGuideJobs);
router.get("/:id", guideJobsController.getGuideJob);
router.put("/:id", guideJobsController.updateGuideJob);
router.delete("/:id", guideJobsController.deleteGuideJob);

module.exports = router;
