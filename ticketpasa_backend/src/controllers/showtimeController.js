const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const Showtime = require("../models/Showtime");
const Seat = require("../models/Seat");
const { generateSeatsForShowtime } = require("../utils/seatLayout");

// @route GET /api/showtimes?movie=&date=&cinema=
const getShowtimes = asyncHandler(async (req, res) => {
  const { movie, date, cinema, city } = req.query;
  const filter = {};
  if (movie) filter.movie = movie;
  if (date) filter.date = date;
  if (cinema) filter.cinema = cinema;

  let query = Showtime.find(filter).populate("movie").populate("cinema").sort({ date: 1, time: 1 });

  let showtimes = await query;

  if (city) {
    showtimes = showtimes.filter(
      (s) => s.cinema && s.cinema.city.toLowerCase() === city.toLowerCase()
    );
  }

  res.json({ success: true, count: showtimes.length, showtimes });
});

// @route POST /api/showtimes (admin)
const createShowtime = asyncHandler(async (req, res) => {
  const { movie, cinema, date, time, experience, price, surgeMultiplier } = req.body;

  if (!movie || !cinema || !date || !time || !price) {
    throw new ApiError(400, "movie, cinema, date, time, and price are required");
  }

  const showtime = await Showtime.create({
    movie,
    cinema,
    date,
    time,
    experience,
    price,
    surgeMultiplier,
  });

  await generateSeatsForShowtime(showtime._id);

  res.status(201).json({ success: true, showtime });
});

// @route PUT /api/showtimes/:id (admin) — includes surge pricing updates
const updateShowtime = asyncHandler(async (req, res) => {
  const showtime = await Showtime.findById(req.params.id);
  if (!showtime) throw new ApiError(404, "Showtime not found");

  Object.assign(showtime, req.body);
  await showtime.save();

  res.json({ success: true, showtime });
});

// @route DELETE /api/showtimes/:id (admin)
const deleteShowtime = asyncHandler(async (req, res) => {
  const showtime = await Showtime.findById(req.params.id);
  if (!showtime) throw new ApiError(404, "Showtime not found");

  await Seat.deleteMany({ showtime: showtime._id });
  await showtime.deleteOne();

  res.json({ success: true, message: "Showtime deleted" });
});

module.exports = { getShowtimes, createShowtime, updateShowtime, deleteShowtime };
