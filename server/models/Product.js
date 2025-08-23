const mongoose = require("mongoose");

/** Subdocumento de variantes (talla/color) */
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
}, { _id: false });

/** Subdocumento de descuento */
const discountSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  type: { type: String, enum: ["PERCENT", "FIXED"], default: "PERCENT" },
  value: { type: Number, default: 0 },          // % o valor fijo
  startAt: { type: Date, default: null },
  endAt: { type: Date, default: null },
}, { _id: false });

/** Producto */
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 5000 },
  price: { type: Number, required: true, min: 0 },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: arr => arr.every(p => typeof p === "string" && p.startsWith("/uploads/products/")),
      message: "Ruta de imagen inválida.",
    }
  },
  /** NOTA: decisión previa del proyecto → una sola categoría por producto */
  categories: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  variants: { type: [variantSchema], default: [] },
  discount: { type: discountSchema, default: {} },
}, { timestamps: true });

/** Método seguro para calcular el precio efectivo */
productSchema.methods.getEffectivePrice = function(now = new Date()) {
  const price = Number(this.price) || 0;
  const d = this.discount || {};
  if (!d.enabled) return price;

  if (d.startAt && now < d.startAt) return price;
  if (d.endAt && now > d.endAt) return price;

  let eff = price;
  if (d.type === "PERCENT") {
    eff = price - (price * (Number(d.value) || 0) / 100);
  } else { // FIXED
    eff = price - (Number(d.value) || 0);
  }
  if (eff < 0) eff = 0;
  return Number(eff.toFixed(2));
};

productSchema.index({ "discount.enabled": 1, "discount.endAt": 1 });

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
module.exports = Product;
