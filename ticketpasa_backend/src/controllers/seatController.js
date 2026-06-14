const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const Seat = require("../models/Seat");

const LOCK_MINUTES = Number(process.env.SEAT_LOCK_MINUTES) || 10;

// Expired locks are lazily reclaimed whenever seats for a showtime are touched.
const releaseExpiredLocks = async (showtimeId) => {
  await Seat.updateMany(
    { showtime: showtimeId, status: "locked", lockExpiry: { $lt: new Date() } },
    { status: "available", lockedBy: null, lockExpiry: null }
  );
};

// @route GET /api/seats/:showtimeId
const getSeatsForShowtime = asyncHandler(async (req, res) => {
  const { showtimeId } = req.params;

  await releaseExpiredLocks(showtimeId);

  const seats = await Seat.find({ showtime: showtimeId }).sort({ row: 1, number: 1 });
  res.json({ success: true, count: seats.length, seats });
});

// @route POST /api/seats/lock  { showtimeId, seatIds: [] }
const lockSeats = asyncHandler(async (req, res) => {
  const { showtimeId, seatIds } = req.body;

  if (!showtimeId || !Array.isArray(seatIds) || seatIds.length === 0) {
    throw new ApiError(400, "showtimeId and a non-empty seatIds array are required");
  }

  await releaseExpiredLocks(showtimeId);

  const lockExpiry = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
  const lockedSeats = [];

  try {
    for (const seatId of seatIds) {
      const seat = await Seat.findOneAndUpdate(
        { _id: seatId, showtime: showtimeId, status: "available" },
        { status: "locked", lockedBy: req.user._id, lockExpiry },
        { new: true }
      );

      if (!seat) {
        throw new ApiError(409, "One or more selected seats are no longer available");
      }
      lockedSeats.push(seat);
    }
  } catch (err) {
    // Roll back any seats we managed to lock in this request before failing.
    const idsToRelease = lockedSeats.map((s) => s._id);
    if (idsToRelease.length) {
      await Seat.updateMany(
        { _id: { $in: idsToRelease } },
        { status: "available", lockedBy: null, lockExpiry: null }
      );
    }
    throw err;
  }

  res.json({ success: true, seats: lockedSeats, lockExpiry });
});

// @route POST /api/seats/release  { seatIds: [] }
const releaseSeats = asyncHandler(async (req, res) => {
  const { seatIds } = req.body;

  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    throw new ApiError(400, "A non-empty seatIds array is required");
  }

  await Seat.updateMany(
    { _id: { $in: seatIds }, lockedBy: req.user._id, status: "locked" },
    { status: "available", lockedBy: null, lockExpiry: null }
  );

  res.json({ success: true, message: "Seats released" });
});

module.exports = { getSeatsForShowtime, lockSeats, releaseSeats, releaseExpiredLocks };
