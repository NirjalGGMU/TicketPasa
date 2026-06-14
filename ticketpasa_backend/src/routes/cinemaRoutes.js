const express = require("express");
const {
  getCinemas,
  getCinemaById,
  createCinema,
  updateCinema,
} = require("../controllers/cinemaController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", getCinemas);
router.get("/:id", getCinemaById);
router.post("/", protect, authorize("admin"), createCinema);
router.put("/:id", protect, authorize("admin"), updateCinema);

module.exports = router;
