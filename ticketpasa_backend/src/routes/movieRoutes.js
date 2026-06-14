const express = require("express");
const {
  getMovies,
  getMovieBySlug,
  createMovie,
  updateMovie,
  deleteMovie,
} = require("../controllers/movieController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", getMovies);
router.get("/:slug", getMovieBySlug);
router.post("/", protect, authorize("admin"), upload.single("poster"), createMovie);
router.put("/:id", protect, authorize("admin"), upload.single("poster"), updateMovie);
router.delete("/:id", protect, authorize("admin"), deleteMovie);

module.exports = router;
