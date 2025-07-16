const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  size: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Size",
    required: true,
  },
  color: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Color",
    required: true,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  images: {
    type: [String],
    default: [],
  },
  categories: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  // se recibe la referencia a Size y Color
  variants: [variantSchema], 
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", productSchema);