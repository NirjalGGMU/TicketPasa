const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const Movie = require("../models/Movie");

// @route GET /api/movies
const getMovies = asyncHandler(async (req, res) => {
  const { status, genre, language, search } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (genre) filter.genre = genre;
  if (language) filter.language = language;
  if (search) filter.title = { $regex: search, $options: "i" };

  const movies = await Movie.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: movies.length, movies });
});

// @route GET /api/movies/:slug
const getMovieBySlug = asyncHandler(async (req, res) => {
  const movie = await Movie.findOne({ slug: req.params.slug });
  if (!movie) throw new ApiError(404, "Movie not found");
  res.json({ success: true, movie });
});

// @route POST /api/movies (admin)
const createMovie = asyncHandler(async (req, res) => {
  const body = { ...req.body };

  ["genre", "language", "cast", "experience"].forEach((field) => {
    if (typeof body[field] === "string") {
      body[field] = body[field].split(",").map((v) => v.trim()).filter(Boolean);
    }
  });

  if (req.file) {
    body.poster = `/uploads/posters/${req.file.filename}`;
  }

  const movie = await Movie.create(body);
  res.status(201).json({ success: true, movie });
});

// @route PUT /api/movies/:id (admin)
const updateMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw new ApiError(404, "Movie not found");

  const body = { ...req.body };
  ["genre", "language", "cast", "experience"].forEach((field) => {
    if (typeof body[field] === "string") {
      body[field] = body[field].split(",").map((v) => v.trim()).filter(Boolean);
    }
  });

  if (req.file) {
    body.poster = `/uploads/posters/${req.file.filename}`;
  }

  Object.assign(movie, body);
  await movie.save();

  res.json({ success: true, movie });
});

// @route DELETE /api/movies/:id (admin)
const deleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw new ApiError(404, "Movie not found");

  await movie.deleteOne();
  res.json({ success: true, message: "Movie deleted" });
});

module.exports = { getMovies, getMovieBySlug, createMovie, updateMovie, deleteMovie };
