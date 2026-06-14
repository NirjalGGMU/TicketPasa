const crypto = require("crypto");

const generateBookingId = () => {
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `TP-${Date.now().toString(36).toUpperCase()}-${random}`;
};

module.exports = generateBookingId;
