const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");

function normalizeStats(doc) {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (doc?.dist && Array.isArray(doc.dist)) {
    for (const d of doc.dist) dist[d._id] = d.count;
  }
  return {
    avg: doc?.avg ? Number(doc.avg.toFixed(2)) : 0,
    total: doc?.total || 0,
    dist,
  };
}


/**
 * GET /api/reviews/product/:productId
 * Público (maybeAuth). Devuelve items + stats (avg, dist, total) + tu reseña si estás logeado.
 */
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

  // Items
  const [items, total, statsAgg] = await Promise.all([
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

  const stats = statsAgg[0]
    ? {
        avg: Number(statsAgg[0].avg.toFixed(2)),
        total,
        dist: { 1:statsAgg[0].d1,2:statsAgg[0].d2,3:statsAgg[0].d3,4:statsAgg[0].d4,5:statsAgg[0].d5 },
      }
    : { avg: 0, total: 0, dist: { 1:0,2:0,3:0,4:0,5:0 } };

  let myReview = null;
  if (req.user?.id) {
    const mine = await Review.findOne({ product: productId, user: req.user.id }).lean();
    if (mine) {
      myReview = {
        id: String(mine._id), rating: mine.rating, text: mine.text,
        createdAt: mine.createdAt, updatedAt: mine.updatedAt,
      };
    }
  }

  const shaped = items.map(r => ({
    id: String(r._id),
    rating: r.rating,
    text: r.text,
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

/**
 * POST /api/reviews/product/:productId
 * Solo usuarios (no admin). Upsert: crea/edita la reseña del usuario.
 * body: { rating: 1..5, text?: string }
 */
exports.upsertMyReview = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user?.id;
  const { rating, text = "" } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ error: "productId inválido" });
  }
  if (!userId) return res.status(401).json({ error: "Auth requerida" });
  if (req.user.role !== "user") {
    return res.status(403).json({ error: "Solo usuarios pueden reseñar" });
  }

  const n = Number(rating);
  if (!Number.isFinite(n) || n < 1 || n > 5) {
    return res.status(400).json({ error: "rating inválido (1..5)" });
  }
  if (typeof text !== "string" || text.length > 1000) {
    return res.status(400).json({ error: "text inválido (<=1000 chars)" });
  }

  const prodExists = await Product.exists({ _id: productId });
  if (!prodExists) return res.status(404).json({ error: "Producto no existe" });

  const doc = await Review.findOneAndUpdate(
    { product: productId, user: userId },
    { $set: { rating: n, text: text.trim() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Recalcular métricas del producto (cache)
  const patch = await Review.recalcForProduct(productId);

  res.status(201).json({
    id: String(doc._id),
    rating: doc.rating,
    text: doc.text,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    stats: { avg: patch.ratingAvg, total: patch.reviewsCount, dist: patch.ratingDist },
  });
};

/**
 * DELETE /api/reviews/:id
 * El autor puede borrar su reseña; el admin puede borrar cualquiera.
 */
exports.deleteReview = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "id inválido" });
  }

  const doc = await Review.findById(id);
  if (!doc) return res.status(404).json({ error: "No existe" });

  const isOwner = req.user?.id && String(doc.user) === String(req.user.id);
  const isAdmin = req.user?.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "No autorizado" });
  }

  await doc.deleteOne();
  const patch = await Review.recalcForProduct(doc.product);

  res.json({ ok: true, stats: { avg: patch.ratingAvg, total: patch.reviewsCount, dist: patch.ratingDist } });
};

exports.deleteMyReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "productId inválido" });
    }

    await Review.deleteOne({ product: productId, user: userId });

    // Recalcular estadísticas
    const [agg] = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $facet: {
          avg: [{ $group: { _id: null, avg: { $avg: "$rating" }, total: { $sum: 1 } } }],
          dist: [{ $group: { _id: "$rating", count: { $sum: 1 } } }],
        },
      },
      {
        $project: {
          avg: { $ifNull: [{ $arrayElemAt: ["$avg.avg", 0] }, 0] },
          total: { $ifNull: [{ $arrayElemAt: ["$avg.total", 0] }, 0] },
          dist: 1,
        },
      },
    ]);

    return res.json({ message: "Reseña eliminada", stats: normalizeStats(agg) });
  } catch (err) {
    console.error("Error deleteMyReview:", err);
    res.status(500).json({ error: "No se pudo eliminar la reseña" });
  }
};