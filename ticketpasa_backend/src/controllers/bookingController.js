const QRCode = require("qrcode");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const Booking = require("../models/Booking");
const Seat = require("../models/Seat");
const Showtime = require("../models/Showtime");
const Loyalty = require("../models/Loyalty");
const generateBookingId = require("../utils/generateBookingId");
const { earnPoints } = require("../services/loyaltyService");
const { POINT_VALUE_IN_CURRENCY } = require("../utils/loyaltyTiers");

const POPULATE_FIELDS = [
  { path: "movie" },
  { path: "cinema" },
  { path: "showtime" },
];

// @route POST /api/bookings
const createBooking = asyncHandler(async (req, res) => {
  const { showtimeId, seatIds, fnbItems = [], loyaltyRedemptionId } = req.body;

  if (!showtimeId || !Array.isArray(seatIds) || seatIds.length === 0) {
    throw new ApiError(400, "showtimeId and a non-empty seatIds array are required");
  }

  const showtime = await Showtime.findById(showtimeId).populate("movie").populate("cinema");
  if (!showtime) throw new ApiError(404, "Showtime not found");

  const seats = await Seat.find({
    _id: { $in: seatIds },
    showtime: showtimeId,
    status: "locked",
    lockedBy: req.user._id,
    lockExpiry: { $gt: new Date() },
  });

  if (seats.length !== seatIds.length) {
    throw new ApiError(409, "One or more seats are not locked by you or the lock has expired");
  }

  const seatsTotal = seats.length * showtime.finalPrice;
  const fnbTotal = fnbItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotal = seatsTotal + fnbTotal;

  let loyaltyDiscount = 0;
  let redemptionEntry = null;
  let loyalty = null;

  if (loyaltyRedemptionId) {
    loyalty = await Loyalty.findOne({ user: req.user._id });
    redemptionEntry = loyalty && loyalty.history.id(loyaltyRedemptionId);

    if (!redemptionEntry || redemptionEntry.type !== "redeem" || redemptionEntry.booking) {
      throw new ApiError(400, "Invalid or already used loyalty redemption");
    }

    loyaltyDiscount = Math.min(redemptionEntry.points * POINT_VALUE_IN_CURRENCY, subtotal);
  }

  const total = Math.max(subtotal - loyaltyDiscount, 0);

  const booking = await Booking.create({
    user: req.user._id,
    movie: showtime.movie._id,
    showtime: showtime._id,
    cinema: showtime.cinema._id,
    seats: seats.map((s) => ({
      seat: s._id,
      row: s.row,
      number: s.number,
      tier: s.tier,
      price: showtime.finalPrice,
    })),
    fnbItems,
    subtotal,
    loyaltyDiscount,
    total,
    bookingId: generateBookingId(),
  });

  const qrPayload = JSON.stringify({ bookingId: booking.bookingId, id: booking._id.toString() });
  booking.qrCode = await QRCode.toDataURL(qrPayload);
  await booking.save();

  await Seat.updateMany(
    { _id: { $in: seats.map((s) => s._id) } },
    { status: "booked", lockedBy: null, lockExpiry: null }
  );

  if (redemptionEntry) {
    redemptionEntry.booking = booking._id;
    await loyalty.save();
  }

  await earnPoints(req.user._id, total, booking._id);

  const populated = await Booking.findById(booking._id).populate(POPULATE_FIELDS);
  res.status(201).json({ success: true, booking: populated });
});

// @route GET /api/bookings/me
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate(POPULATE_FIELDS)
    .sort({ createdAt: -1 });

  res.json({ success: true, count: bookings.length, bookings });
});

// @route GET /api/bookings/:id
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(POPULATE_FIELDS).populate("user", "name email");
  if (!booking) throw new ApiError(404, "Booking not found");

  const isOwner = booking.user._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to view this booking");
  }

  res.json({ success: true, booking });
});

// @route PATCH /api/bookings/:id/cancel
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Booking not found");

  const isOwner = booking.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to cancel this booking");
  }

  if (booking.status === "cancelled") {
    throw new ApiError(400, "Booking is already cancelled");
  }

  booking.status = "cancelled";
  await booking.save();

  await Seat.updateMany(
    { _id: { $in: booking.seats.map((s) => s.seat) } },
    { status: "available", lockedBy: null, lockExpiry: null }
  );

  res.json({ success: true, booking });
});

// @route GET /api/bookings (admin) — filters: status, movie, cinema, from, to
const getAllBookings = asyncHandler(async (req, res) => {
  const { status, movie, cinema, from, to } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (movie) filter.movie = movie;
  if (cinema) filter.cinema = cinema;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const bookings = await Booking.find(filter)
    .populate(POPULATE_FIELDS)
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: bookings.length, bookings });
});

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking, getAllBookings };
