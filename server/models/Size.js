const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
});

const Size = mongoose.models.Size || mongoose.model("Size", sizeSchema);
module.exports = Size;