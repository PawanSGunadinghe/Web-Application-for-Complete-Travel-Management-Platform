// routes/bookings.js
const express = require("express");
const router = express.Router();
const bookingsController = require("../controllers/bookingsController");
const { requireAuth } = require("../middleware/auth");

router.post("/", requireAuth, bookingsController.createBooking);
router.get("/mine", requireAuth, bookingsController.getMyBookings);
router.get("/", requireAuth, bookingsController.listBookings);
router.get("/all", requireAuth, bookingsController.listAllBookings);
router.get("/user/:id", requireAuth, bookingsController.getUserBookings);
router.get("/:id", requireAuth, bookingsController.getBooking);
router.patch("/:id", requireAuth, bookingsController.updateBooking);
router.patch("/:id/assignment", requireAuth, bookingsController.updateAssignment);
router.delete("/:id", requireAuth, bookingsController.deleteBooking);

module.exports = router;
