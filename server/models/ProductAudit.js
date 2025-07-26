const mongoose = require("mongoose");

const productAuditSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, enum: ["created", "updated", "deleted"], required: true },
  changes: { type: Object }, // { campo: { old: val, new: val } }
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ProductAudit", productAuditSchema);
