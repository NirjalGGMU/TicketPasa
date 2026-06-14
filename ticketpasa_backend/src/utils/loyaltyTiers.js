const TIERS = [
  { name: "Platinum", minPoints: 7000 },
  { name: "Gold", minPoints: 3000 },
  { name: "Silver", minPoints: 1000 },
  { name: "Bronze", minPoints: 0 },
];

const POINTS_PER_CURRENCY_UNIT = 1 / 100; // 1 point per 100 spent
const POINT_VALUE_IN_CURRENCY = 1; // 1 point = 1 currency unit discount

const tierForPoints = (points) => {
  return TIERS.find((t) => points >= t.minPoints).name;
};

const pointsForAmount = (amount) => {
  return Math.floor(amount * POINTS_PER_CURRENCY_UNIT);
};

module.exports = { tierForPoints, pointsForAmount, POINT_VALUE_IN_CURRENCY };
