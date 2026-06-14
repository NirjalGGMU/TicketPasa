const Loyalty = require("../models/Loyalty");
const User = require("../models/User");
const { tierForPoints, pointsForAmount } = require("../utils/loyaltyTiers");

const earnPoints = async (userId, amountSpent, bookingId) => {
  const points = pointsForAmount(amountSpent);
  if (points <= 0) return null;

  const loyalty = await Loyalty.findOneAndUpdate(
    { user: userId },
    { $inc: { points } },
    { new: true, upsert: true }
  );

  loyalty.tier = tierForPoints(loyalty.points);
  loyalty.history.push({ type: "earn", points, booking: bookingId });
  await loyalty.save();

  await User.findByIdAndUpdate(userId, { loyaltyPoints: loyalty.points, tier: loyalty.tier });

  return loyalty;
};

module.exports = { earnPoints };
