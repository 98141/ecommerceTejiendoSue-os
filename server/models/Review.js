const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, trim: true, maxlength: 2000 },
    images: [
      {
        full: { type: String, required: true },
        thumb: { type: String, required: true },
      },
    ],
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Un usuario solo puede dejar 1 reseña por producto
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Recalcular y cachear en Product
reviewSchema.statics.recalcForProduct = async function (productId) {
  const Review = this;
  const Product = mongoose.model("Product");

  const [row] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$product",
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
        d1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        d2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
        d3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
        d4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
        d5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
      },
    },
  ]);

  const patch = row
    ? {
        rating: Number(row.avg.toFixed(2)), // compat: muchos front leen Product.rating
        reviewsCount: row.count,
        ratingAvg: Number(row.avg.toFixed(2)), // opcional
        ratingDist: { 1: row.d1, 2: row.d2, 3: row.d3, 4: row.d4, 5: row.d5 }, // opcional
      }
    : {
        rating: 0,
        reviewsCount: 0,
        ratingAvg: 0,
        ratingDist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };

  await Product.updateOne({ _id: productId }, { $set: patch });
  return {
    avg: patch.rating,
    total: patch.reviewsCount,
    dist: patch.ratingDist,
  };
};

module.exports = mongoose.model("Review", reviewSchema);
