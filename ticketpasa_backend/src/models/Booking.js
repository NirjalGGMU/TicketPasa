const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true },
    cinema: { type: mongoose.Schema.Types.ObjectId, ref: "Cinema", required: true },
    seats: [
      {
        seat: { type: mongoose.Schema.Types.ObjectId, ref: "Seat" },
        row: String,
        number: Number,
        tier: String,
        price: Number,
      },
    ],
    fnbItems: [
      {
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    subtotal: { type: Number, required: true },
    loyaltyDiscount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
    bookingId: { type: String, required: true, unique: true },
    qrCode: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
