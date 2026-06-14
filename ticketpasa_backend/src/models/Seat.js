const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true, index: true },
    row: { type: String, required: true },
    number: { type: Number, required: true },
    tier: { type: String, enum: ["Silver", "Gold", "Platinum"], default: "Silver" },
    status: {
      type: String,
      enum: ["available", "locked", "booked"],
      default: "available",
    },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    lockExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

seatSchema.index({ showtime: 1, row: 1, number: 1 }, { unique: true });

module.exports = mongoose.model("Seat", seatSchema);
