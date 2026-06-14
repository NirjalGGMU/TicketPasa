const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const Loyalty = require("../models/Loyalty");
const User = require("../models/User");
const { earnPoints } = require("../services/loyaltyService");
const { tierForPoints, POINT_VALUE_IN_CURRENCY } = require("../utils/loyaltyTiers");

// @route GET /api/loyalty/me
const getMyLoyalty = asyncHandler(async (req, res) => {
  let loyalty = await Loyalty.findOne({ user: req.user._id });
  if (!loyalty) {
    loyalty = await Loyalty.create({ user: req.user._id });
  }
  res.json({ success: true, loyalty });
});

// @route POST /api/loyalty/earn (admin) — manual/admin adjustment; bookings earn points automatically
const earn = asyncHandler(async (req, res) => {
  const { userId, amount, bookingId } = req.body;
  if (!userId || !amount) throw new ApiError(400, "userId and amount are required");

  const loyalty = await earnPoints(userId, amount, bookingId);
  res.json({ success: true, loyalty });
});

// @route POST /api/loyalty/redeem  { points }
const redeem = asyncHandler(async (req, res) => {
  const { points } = req.body;
  const pointsToRedeem = Number(points);

  if (!pointsToRedeem || pointsToRedeem <= 0) {
    throw new ApiError(400, "A positive number of points is required");
  }

  const loyalty = await Loyalty.findOne({ user: req.user._id });
  if (!loyalty || loyalty.points < pointsToRedeem) {
    throw new ApiError(400, "Not enough loyalty points");
  }

  loyalty.points -= pointsToRedeem;
  loyalty.tier = tierForPoints(loyalty.points);
  loyalty.history.push({ type: "redeem", points: pointsToRedeem });
  await loyalty.save();

  await User.findByIdAndUpdate(req.user._id, {
    loyaltyPoints: loyalty.points,
    tier: loyalty.tier,
  });

  const redemption = loyalty.history[loyalty.history.length - 1];
  const discountAmount = pointsToRedeem * POINT_VALUE_IN_CURRENCY;

  res.json({
    success: true,
    redemptionId: redemption._id,
    pointsRedeemed: pointsToRedeem,
    discountAmount,
    remainingPoints: loyalty.points,
  });
});

module.exports = { getMyLoyalty, earn, redeem };
