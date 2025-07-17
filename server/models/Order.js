const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: { type: Number, required: true },
  size: { type: mongoose.Schema.Types.ObjectId, ref: "Size" },
  color: { type: mongoose.Schema.Types.ObjectId, ref: "Color" },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pendiente", "enviado", "entregado", "cancelado"],
      default: "pendiente",
    },
    trackingNumber: { type: String, default: "" },
    shippingCompany: { type: String, default: "" },
    adminComment: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
