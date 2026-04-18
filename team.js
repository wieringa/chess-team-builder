const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    players: [
      {
        name: String,
        country: String,
        rating: Number
      }
    ],
    avg: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", TeamSchema);
