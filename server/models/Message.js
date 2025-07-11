const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["abierto", "cerrado", "en_espera"],
      default: "abierto",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
