const mongoose = require("mongoose");

const loyaltySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    points: { type: Number, default: 0 },
    tier: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", "Platinum"],
      default: "Bronze",
    },
    history: [
      {
        type: { type: String, enum: ["earn", "redeem"], required: true },
        points: { type: Number, required: true },
        booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
        note: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Loyalty", loyaltySchema);
