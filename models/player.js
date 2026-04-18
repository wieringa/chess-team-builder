const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    country: { type: String, enum: ["NL", "BE", "DE"], required: true },
    rating: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Player", PlayerSchema);
