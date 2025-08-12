// models/Order.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1 },
  size:     { type: mongoose.Schema.Types.ObjectId, ref: "Size" },
  color:    { type: mongoose.Schema.Types.ObjectId, ref: "Color" },
  // Precio efectivo al momento de compra (con descuento aplicado si corresponde)
  unitPrice:{ type: Number, required: true, min: 0 },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    user:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pendiente", "enviado", "entregado", "cancelado"],
      default: "pendiente",
      index: true,
    },
    trackingNumber:  { type: String, default: "" },
    shippingCompany: { type: String, default: "" },
    adminComment:    { type: String, default: "" },
  },
  { timestamps: true }
);

// Índices útiles
orderSchema.index({ "items.product": 1, createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
