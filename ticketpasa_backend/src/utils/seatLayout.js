const Seat = require("../models/Seat");

// Default hall layout: rows A-B Platinum, C-E Gold, F-J Silver, 12 seats per row.
const DEFAULT_LAYOUT = [
  { rows: ["A", "B"], tier: "Platinum" },
  { rows: ["C", "D", "E"], tier: "Gold" },
  { rows: ["F", "G", "H", "I", "J"], tier: "Silver" },
];
const SEATS_PER_ROW = 12;

const generateSeatsForShowtime = async (showtimeId, layout = DEFAULT_LAYOUT) => {
  const seatDocs = [];

  for (const section of layout) {
    for (const row of section.rows) {
      for (let number = 1; number <= SEATS_PER_ROW; number++) {
        seatDocs.push({
          showtime: showtimeId,
          row,
          number,
          tier: section.tier,
          status: "available",
        });
      }
    }
  }

  await Seat.insertMany(seatDocs);
};

module.exports = { generateSeatsForShowtime, DEFAULT_LAYOUT, SEATS_PER_ROW };
