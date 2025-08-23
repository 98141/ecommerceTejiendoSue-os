const mongoose = require("mongoose");

const colorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
});

const Color = mongoose.models.Color || mongoose.model("Color", colorSchema);
module.exports = Color;