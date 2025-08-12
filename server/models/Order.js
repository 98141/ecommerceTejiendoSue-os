const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: mongoose.Schema.Types.ObjectId, ref: "Size" },
    color: { type: mongoose.Schema.Types.ObjectId, ref: "Color" },

    // Precio efectivo al momento de compra (con descuentos aplicados)
    unitPrice: { type: Number, required: true, min: 0 },

    // Snapshots de inventario al momento de cerrar la compra
    stockBeforePurchase: { type: Number, default: null }, // antes de descontar
    stockAtPurchase: { type: Number, required: true }, // después de descontar (inmutable)
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pendiente", "enviado", "entregado", "cancelado"],
      default: "pendiente",
      index: true,
    },
    trackingNumber: { type: String, default: "" },
    shippingCompany: { type: String, default: "" },
    adminComment: { type: String, default: "" },
  },
  { timestamps: true }
);

// Índices útiles para reporting
orderSchema.index({ "items.product": 1, createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
