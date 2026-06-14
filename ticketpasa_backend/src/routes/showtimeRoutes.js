const express = require("express");
const {
  getShowtimes,
  createShowtime,
  updateShowtime,
  deleteShowtime,
} = require("../controllers/showtimeController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", getShowtimes);
router.post("/", protect, authorize("admin"), createShowtime);
router.put("/:id", protect, authorize("admin"), updateShowtime);
router.delete("/:id", protect, authorize("admin"), deleteShowtime);

module.exports = router;
