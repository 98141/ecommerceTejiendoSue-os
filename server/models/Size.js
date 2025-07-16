const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
});

module.exports = mongoose.model("Size", sizeSchema);