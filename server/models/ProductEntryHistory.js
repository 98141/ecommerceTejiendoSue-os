const mongoose = require("mongoose");

const VariantHistorySchema = new mongoose.Schema({
  size: { type: mongoose.Schema.Types.ObjectId, ref: "Size" },
  color: { type: mongoose.Schema.Types.ObjectId, ref: "Color" },
  initialStock: { type: Number, required: true }
});

const ProductEntryHistorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: String,
  description: String,
  price: Number,
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  variants: [VariantHistorySchema],
  images: [String],
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["activo", "eliminado"], default: "activo" }
});

module.exports = mongoose.model("ProductEntryHistory", ProductEntryHistorySchema);
