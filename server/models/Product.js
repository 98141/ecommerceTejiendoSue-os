const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    size: { type: mongoose.Schema.Types.ObjectId, ref: "Size", required: true },
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
      required: true,
    },
    stock: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const discountSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    type: { type: String, enum: ["PERCENT", "FIXED"], default: "PERCENT" },
    value: { type: Number, default: 0 },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) =>
          arr.every(
            (p) => typeof p === "string" && p.startsWith("/uploads/products/")
          ),
        message: "Ruta de imagen inválida.",
      },
    },
    categories: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    variants: { type: [variantSchema], default: [] },
    discount: { type: discountSchema, default: {} },

    // NUEVOS
    salesCount: { type: Number, default: 0, index: true },
    trendingScore: { type: Number, default: 0, index: true }, // opcional
  },
  { timestamps: true }
);

productSchema.methods.getEffectivePrice = function (now = new Date()) {
  const price = Number(this.price) || 0;
  const d = this.discount || {};
  if (!d.enabled) return price;
  if (d.startAt && now < d.startAt) return price;
  if (d.endAt && now > d.endAt) return price;
  let eff = price;
  if (d.type === "PERCENT")
    eff = price - (price * (Number(d.value) || 0)) / 100;
  else eff = price - (Number(d.value) || 0);
  if (eff < 0) eff = 0;
  return Number(eff.toFixed(2));
};

// ÍNDICES
productSchema.index({ "discount.enabled": 1, "discount.endAt": 1 });
productSchema.index({ categories: 1, createdAt: -1 });
productSchema.index({ salesCount: -1, categories: 1 });
productSchema.index({ "variants.size": 1 });
productSchema.index({ "variants.color": 1 });
// Opcional: búsqueda simple por texto
// productSchema.index({ name: "text", description: "text" });

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
module.exports = Product;
