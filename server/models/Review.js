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
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    text: {
      type: String,
      maxlength: 1000,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Un usuario solo puede dejar 1 reseña por producto
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// === Helper para recalcular promedio y conteo en Product ===
reviewSchema.statics.recalcForProduct = async function (productId) {
  const Review = this;
  const Product = mongoose.model("Product");

  const agg = await Review.aggregate([
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

  const stats = agg[0] || null;
  const patch = stats
    ? {
        ratingAvg: Number(stats.avg.toFixed(2)),
        reviewsCount: stats.count,
        ratingDist: {
          1: stats.d1, 2: stats.d2, 3: stats.d3, 4: stats.d4, 5: stats.d5,
        },
      }
    : { ratingAvg: 0, reviewsCount: 0, ratingDist: {1:0,2:0,3:0,4:0,5:0} };

  await Product.updateOne(
    { _id: productId },
    { $set: patch }
  );
  return patch;
};

module.exports = mongoose.model("Review", reviewSchema);
