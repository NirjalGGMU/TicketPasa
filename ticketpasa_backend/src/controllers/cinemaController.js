const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const Cinema = require("../models/Cinema");

// @route GET /api/cinemas
const getCinemas = asyncHandler(async (req, res) => {
  const { city } = req.query;
  const filter = {};
  if (city) filter.city = { $regex: `^${city}$`, $options: "i" };

  const cinemas = await Cinema.find(filter).sort({ name: 1 });
  res.json({ success: true, count: cinemas.length, cinemas });
});

// @route GET /api/cinemas/:id
const getCinemaById = asyncHandler(async (req, res) => {
  const cinema = await Cinema.findById(req.params.id);
  if (!cinema) throw new ApiError(404, "Cinema not found");
  res.json({ success: true, cinema });
});

// @route POST /api/cinemas (admin)
const createCinema = asyncHandler(async (req, res) => {
  const cinema = await Cinema.create(req.body);
  res.status(201).json({ success: true, cinema });
});

// @route PUT /api/cinemas/:id (admin)
const updateCinema = asyncHandler(async (req, res) => {
  const cinema = await Cinema.findById(req.params.id);
  if (!cinema) throw new ApiError(404, "Cinema not found");

  Object.assign(cinema, req.body);
  await cinema.save();

  res.json({ success: true, cinema });
});

module.exports = { getCinemas, getCinemaById, createCinema, updateCinema };
