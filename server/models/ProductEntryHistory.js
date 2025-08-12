const mongoose = require("mongoose");

const VariantSnapshotSchema = new mongoose.Schema({
  size: { type: mongoose.Schema.Types.ObjectId, ref: "Size" },
  color: { type: mongoose.Schema.Types.ObjectId, ref: "Color" },
  initialStock: { type: Number, default: 0 }
}, { _id: false });

const ProductEntryHistorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", index: true },

  // Snapshot principal
  name: { type: String, required: true, index: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true, min: 0, index: true },
  images: { type: [String], default: [] },

  // En tu proyecto hay UNA categoría por producto
  categories: { type: mongoose.Schema.Types.ObjectId, ref: "Category", index: true },

  // Variantes (talla/color) con stock inicial
  variants: { type: [VariantSnapshotSchema], default: [] }
}, { timestamps: true });

ProductEntryHistorySchema.index({ createdAt: -1 });
ProductEntryHistorySchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("ProductEntryHistory", ProductEntryHistorySchema);


