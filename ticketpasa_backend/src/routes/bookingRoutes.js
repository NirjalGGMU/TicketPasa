const express = require("express");
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
} = require("../controllers/bookingController");
const { protect, authorize } = require("../middleware/auth");
const { bookingLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/", protect, bookingLimiter, createBooking);
router.get("/me", protect, getMyBookings);
router.get("/", protect, authorize("admin"), getAllBookings);
router.get("/:id", protect, getBookingById);
router.patch("/:id/cancel", protect, cancelBooking);

module.exports = router;
