const mongoose = require("mongoose");

const cinemaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true },
    city: { type: String, required: true, index: true },
    screens: { type: Number, default: 1 },
    facilities: [{ type: String }],
    image: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cinema", cinemaSchema);
