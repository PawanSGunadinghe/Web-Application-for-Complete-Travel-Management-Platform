// routes/feedback.js  (CommonJS)
const express = require("express");
const { requireAuth } = require("../middleware/auth");
const feedbackController = require("../controllers/feedbackController");

const router = express.Router();

// GET /api/feedbacks?limit=20&page=1&q=word&sort=new|top
router.get("/", feedbackController.list);
// GET /api/feedbacks/:id
router.get("/:id", feedbackController.getOne);
// POST /api/feedbacks  (auth required)
router.post("/", requireAuth, feedbackController.create);
// PATCH /api/feedbacks/:id  (auth required)
router.patch("/:id", requireAuth, feedbackController.update);
// DELETE /api/feedbacks/:id  (auth required)
router.delete("/:id", requireAuth, feedbackController.remove);

module.exports = router;
