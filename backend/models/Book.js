const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title:          { type: String, required: true, trim: true },
    author:         { type: String, required: true, trim: true },
    genre:          { type: String, required: true, trim: true },
    isbn:           { type: String, trim: true },
    year:           { type: Number },
    description:    { type: String, trim: true },
    totalCopies:    { type: Number, required: true, min: 1, default: 1 },
    availableCopies:{ type: Number, required: true, min: 0 },
    // Cover image: stored as base64 data URL OR external URL (Open Library API)
    coverImage:     { type: String, default: "" },
    addedBy:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive:       { type: Boolean, default: true },
  },
  { timestamps: true }
);

bookSchema.pre("save", function (next) {
  if (this.isNew && this.availableCopies === undefined) {
    this.availableCopies = this.totalCopies;
  }
  next();
});

bookSchema.virtual("borrowedCopies").get(function () {
  return this.totalCopies - this.availableCopies;
});

module.exports = mongoose.model("Book", bookSchema);
