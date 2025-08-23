const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const clampQty = (q) => Math.max(1, Math.min(20, Number(q) || 0));

const CartItemSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: "Product", required: true },
    size: { type: Types.ObjectId, ref: "Size", default: null },
    color: { type: Types.ObjectId, ref: "Color", default: null },
    quantity: { type: Number, required: true, min: 1, max: 20, default: 1 },
  },
  { _id: false }
);

const CartSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: { type: [CartItemSchema], default: [] },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

CartSchema.methods.findIndexByVariant = function (productId, sizeId, colorId) {
  const p = String(productId);
  const s = sizeId ? String(sizeId) : "";
  const c = colorId ? String(colorId) : "";
  return this.items.findIndex((it) => {
    const ip = String(it.product);
    const is = it.size ? String(it.size) : "";
    const ic = it.color ? String(it.color) : "";
    return ip === p && is === s && ic === c;
  });
};

CartSchema.methods.upsertItem = function ({
  productId,
  sizeId,
  colorId,
  quantity,
}) {
  const idx = this.findIndexByVariant(productId, sizeId, colorId);
  if (idx === -1) {
    this.items.push({
      product: productId,
      size: sizeId || null,
      color: colorId || null,
      quantity: clampQty(quantity),
    });
  } else {
    this.items[idx].quantity = clampQty(
      this.items[idx].quantity + (Number(quantity) || 0)
    );
  }
};

CartSchema.methods.updateQty = function ({
  productId,
  sizeId,
  colorId,
  quantity,
}) {
  const idx = this.findIndexByVariant(productId, sizeId, colorId);
  if (idx === -1) return false;
  this.items[idx].quantity = clampQty(quantity);
  return true;
};

CartSchema.methods.removeItem = function ({ productId, sizeId, colorId }) {
  const idx = this.findIndexByVariant(productId, sizeId, colorId);
  if (idx === -1) return false;
  this.items.splice(idx, 1);
  return true;
};

CartSchema.methods.bumpVersion = function () {
  this.version = (this.version || 0) + 1;
};

const Cart = mongoose.models.Cart || mongoose.model('Cart', CartSchema);
module.exports = { Cart, clampQty };
