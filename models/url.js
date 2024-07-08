const mongoose = require("mongoose");

const urlSchmea = new mongoose.Schema(
  {
    longUrl: {
      type: String,
      required: true,
    },
    shortUrl: {
      type: String,
      required: true,
      unique: true,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Url = mongoose.models.Url || mongoose.model("Url", urlSchmea);
module.exports = Url;
