const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");

// GET /api/reviews/product/:productId
exports.listByProduct = async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ error: "productId inválido" });
  }

  const {
    page = 1,
    limit = 10,
    sort = "createdAt:desc", // createdAt|rating : asc|desc
  } = req.query;

  const [sf, sd] = String(sort).split(":");
  const field = sf === "rating" ? "rating" : "createdAt";
  const dir = sd === "asc" ? 1 : -1;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

  const [items, total, agg] = await Promise.all([
    Review.find({ product: productId })
      .populate({ path: "user", select: "name" })
      .sort({ [field]: dir, _id: dir })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Review.countDocuments({ product: productId }),
    Review.aggregate([
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
    ]),
  ]);

  const stats = agg[0]
    ? {
        avg: Number(agg[0].avg.toFixed(2)),
        total,
        dist: {
          1: agg[0].d1,
          2: agg[0].d2,
          3: agg[0].d3,
          4: agg[0].d4,
          5: agg[0].d5,
        },
      }
    : { avg: 0, total: 0, dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

  let myReview = null;
  if (req.user?.id) {
    const mine = await Review.findOne({
      product: productId,
      user: req.user.id,
    }).lean();
    if (mine) {
      myReview = {
        id: String(mine._id),
        rating: mine.rating,
        text: mine.text,
        images: mine.images || [],
        createdAt: mine.createdAt,
        updatedAt: mine.updatedAt,
      };
    }
  }

  const shaped = items.map((r) => ({
    id: String(r._id),
    rating: r.rating,
    text: r.text,
    images: r.images || [],
    author: r.user?.name || "Usuario",
    createdAt: r.createdAt,
  }));

  res.json({
    items: shaped,
    page: pageNum,
    limit: limitNum,
    total,
    stats,
    myReview,
  });
};

// POST /api/reviews/product/:productId  (JSON o multipart)
// Si vienen nuevas imágenes -> REEMPLAZAN las anteriores; si no, se mantienen.
exports.upsertMyReview = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ error: "productId inválido" });
  }
  if (!userId) return res.status(401).json({ error: "Auth requerida" });
  if (req.user.role !== "user") {
    return res.status(403).json({ error: "Solo usuarios pueden reseñar" });
  }

  const rating = Number(req.body?.rating);
  const text = String(req.body?.text || "")
    .trim()
    .slice(0, 2000);

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating inválido (1..5)" });
  }

  const prodExists = await Product.exists({ _id: productId });
  if (!prodExists) return res.status(404).json({ error: "Producto no existe" });

  const update = { rating, text, isEdited: true };
  if (Array.isArray(req.processedImages) && req.processedImages.length) {
    update.images = req.processedImages; // reemplaza
  }

  const doc = await Review.findOneAndUpdate(
    { product: productId, user: userId },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate("user", "name");

  const stats = await Review.recalcForProduct(productId);

  res.status(201).json({
    id: String(doc._id),
    rating: doc.rating,
    text: doc.text,
    images: doc.images || [],
    author: doc.user?.name || "Usuario",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    stats,
  });
};

// DELETE /api/reviews/product/:productId (mi reseña)
exports.deleteMyReview = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user?.id;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ error: "productId inválido" });
  }
  await Review.deleteOne({ product: productId, user: userId });
  const stats = await Review.recalcForProduct(productId);
  res.json({ ok: true, stats });
};

// DELETE /api/reviews/:id (admin o dueño)
exports.deleteReview = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "id inválido" });
  }
  const doc = await Review.findById(id);
  if (!doc) return res.status(404).json({ error: "No existe" });

  const isOwner = req.user?.id && String(doc.user) === String(req.user.id);
  const isAdmin = req.user?.role === "admin";
  if (!isOwner && !isAdmin)
    return res.status(403).json({ error: "No autorizado" });

  const productId = doc.product;
  await doc.deleteOne();
  const stats = await Review.recalcForProduct(productId);
  res.json({ ok: true, stats });
};
