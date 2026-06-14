const mongoose = require("mongoose");
const slugify = require("slugify");

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    genre: [{ type: String }],
    language: [{ type: String }],
    duration: { type: Number, required: true },
    cast: [{ type: String }],
    director: { type: String },
    poster: { type: String },
    backdrop: { type: String },
    ageRating: { type: String, default: "U" },
    experience: [{ type: String }],
    status: {
      type: String,
      enum: ["now-showing", "upcoming", "archived"],
      default: "upcoming",
    },
    description: { type: String },
    releaseDate: { type: Date },
  },
  { timestamps: true }
);

movieSchema.pre("validate", function () {
  if (this.title && (!this.slug || this.isModified("title"))) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
});

module.exports = mongoose.model("Movie", movieSchema);
