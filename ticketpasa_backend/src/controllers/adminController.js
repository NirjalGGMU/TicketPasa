const asyncHandler = require("../utils/asyncHandler");
const Booking = require("../models/Booking");
const Seat = require("../models/Seat");
const Cinema = require("../models/Cinema");

// @route GET /api/admin/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const confirmedFilter = { status: "confirmed" };

  const [salesAgg, totalBookings, cancelledBookings, seatCounts] = await Promise.all([
    Booking.aggregate([
      { $match: confirmedFilter },
      { $group: { _id: null, totalSales: { $sum: "$total" } } },
    ]),
    Booking.countDocuments(confirmedFilter),
    Booking.countDocuments({ status: "cancelled" }),
    Seat.aggregate([
      {
        $group: {
          _id: null,
          totalSeats: { $sum: 1 },
          bookedSeats: { $sum: { $cond: [{ $eq: ["$status", "booked"] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const totalSales = salesAgg[0]?.totalSales || 0;
  const totalSeats = seatCounts[0]?.totalSeats || 0;
  const bookedSeats = seatCounts[0]?.bookedSeats || 0;
  const occupancyRate = totalSeats > 0 ? Number(((bookedSeats / totalSeats) * 100).toFixed(2)) : 0;

  res.json({
    success: true,
    dashboard: {
      totalSales,
      totalBookings,
      cancelledBookings,
      occupancyRate,
      bookedSeats,
      totalSeats,
    },
  });
});

// @route GET /api/admin/analytics
const getAnalytics = asyncHandler(async (req, res) => {
  const confirmedFilter = { status: "confirmed" };

  const [revenueByMonth, revenueByCity] = await Promise.all([
    Booking.aggregate([
      { $match: confirmedFilter },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$total" },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Booking.aggregate([
      { $match: confirmedFilter },
      {
        $lookup: {
          from: Cinema.collection.name,
          localField: "cinema",
          foreignField: "_id",
          as: "cinemaInfo",
        },
      },
      { $unwind: "$cinemaInfo" },
      {
        $group: {
          _id: "$cinemaInfo.city",
          revenue: { $sum: "$total" },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]),
  ]);

  res.json({
    success: true,
    analytics: {
      revenueByMonth: revenueByMonth.map((r) => ({
        year: r._id.year,
        month: r._id.month,
        revenue: r.revenue,
        bookings: r.bookings,
      })),
      revenueByCity: revenueByCity.map((r) => ({
        city: r._id,
        revenue: r.revenue,
        bookings: r.bookings,
      })),
    },
  });
});

// @route GET /api/admin/reports?format=csv
const getReports = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate("user", "name email")
    .populate("movie", "title")
    .populate("cinema", "name city")
    .sort({ createdAt: -1 });

  if (req.query.format === "csv") {
    const header = "bookingId,user,email,movie,cinema,city,seats,total,status,createdAt";
    const rows = bookings.map((b) =>
      [
        b.bookingId,
        b.user?.name || "",
        b.user?.email || "",
        b.movie?.title || "",
        b.cinema?.name || "",
        b.cinema?.city || "",
        b.seats.length,
        b.total,
        b.status,
        b.createdAt.toISOString(),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = [header, ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=bookings-report.csv");
    return res.send(csv);
  }

  res.json({ success: true, count: bookings.length, bookings });
});

module.exports = { getDashboard, getAnalytics, getReports };
