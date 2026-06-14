const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true, index: true },
    cinema: { type: mongoose.Schema.Types.ObjectId, ref: "Cinema", required: true, index: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    experience: { type: String, default: "2D" },
    price: { type: Number, required: true },
    surgeMultiplier: { type: Number, default: 1 },
  },
  { timestamps: true }
);

showtimeSchema.virtual("finalPrice").get(function () {
  return Math.round(this.price * this.surgeMultiplier);
});

showtimeSchema.set("toJSON", { virtuals: true });
showtimeSchema.set("toObject", { virtuals: true });

showtimeSchema.index({ movie: 1, date: 1 });

module.exports = mongoose.model("Showtime", showtimeSchema);
