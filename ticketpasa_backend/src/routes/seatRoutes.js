const express = require("express");
const { getSeatsForShowtime, lockSeats, releaseSeats } = require("../controllers/seatController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/:showtimeId", getSeatsForShowtime);
router.post("/lock", protect, lockSeats);
router.post("/release", protect, releaseSeats);

module.exports = router;
