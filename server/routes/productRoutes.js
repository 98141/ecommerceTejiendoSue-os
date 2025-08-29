const express = require("express");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductHistory,
  getProductEntryHistory,
  getVariantLedgerByProduct,
  getProductSalesHistory,
} = require("../controllers/productController");

const {
  searchProducts,
  getProductSections,
} = require("../controllers/productSearchController");

const Product = require("../models/Product");
const { verifyToken, isAdmin } = require("../middleware/auth");
const uploadMiddleware = require("../middleware/uploadMiddleware");

const router = express.Router();

/* ======================= Rate limit ======================= */
const productLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Demasiadas solicitudes, intenta más tarde.",
});

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

/* ======================= Helpers públicos ======================= */
function computeEffectivePrice(p, now = new Date()) {
  const price = Number(p?.price) || 0;
  const d = p?.discount || {};
  if (!d.enabled) return price;
  const start = d.startAt ? new Date(d.startAt) : null;
  const end = d.endAt ? new Date(d.endAt) : null;
  if (start && now < start) return price;
  if (end && now > end) return price;

  let eff = price;
  if (d.type === "PERCENT")
    eff = price - (price * (Number(d.value) || 0)) / 100;
  else eff = price - (Number(d.value) || 0);
  return Number(Math.max(0, eff).toFixed(2));
}

function shapePublicProduct(p) {
  return {
    _id: p._id,
    name: p.name,
    price: p.price,
    effectivePrice: computeEffectivePrice(p),
    images: Array.isArray(p.images) ? p.images : [],
    variants: Array.isArray(p.variants)
      ? p.variants.map((v) => ({
          size: v?.size
            ? { _id: v.size._id || v.size, label: v.size.label }
            : null,
          color: v?.color
            ? { _id: v.color._id || v.color, name: v.color.name }
            : null,
          stock: typeof v?.stock === "number" ? v.stock : 0,
        }))
      : [],
  };
}

/* ====================== Validadores CRUD ====================== */
const createUpdateValidators = [
  body("name").optional().isString().trim().isLength({ min: 1, max: 200 }),
  body("description").optional().isString().trim().isLength({ max: 5000 }),
  body("price").optional().isFloat({ min: 0 }),
  body("categories")
    .optional()
    .custom((v) => {
      if (!isObjectId(v)) throw new Error("Categoría inválida.");
      return true;
    }),
  body("variants")
    .optional()
    .custom((raw) => {
      try {
        const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (!Array.isArray(arr)) throw new Error();
        for (const v of arr) {
          if (!isObjectId(v.size) || !isObjectId(v.color))
            throw new Error("Variante inválida (size/color).");
          if (!(Number(v.stock) >= 0))
            throw new Error("Variante inválida (stock).");
        }
        return true;
      } catch {
        throw new Error("Formato de variantes inválido.");
      }
    }),
  body("discount[enabled]").optional().isIn(["true", "false"]),
  body("discount[type]").optional().isIn(["PERCENT", "FIXED"]),
  body("discount[value]").optional().isFloat({ min: 0 }),
  body("discount[startAt]").optional().isISO8601(),
  body("discount[endAt]").optional().isISO8601(),
];

/* ================================================================
   RUTAS PÚBLICAS — ¡IMPORTANTE! Van ANTES de `/:id`
   para que `/:id` no capture `/bulk`, `/public/:id`, `/search`, `/sections`.
   ================================================================ */

/** Handler robusto para /bulk (GET y POST) */
async function bulkHandler(req, res, next) {
  try {
    let raw = [];
    if (req.method === "GET") {
      const q = req.query.ids;
      if (Array.isArray(q)) raw = q;
      else if (typeof q === "string") raw = q.split(",");
    } else if (req.method === "POST") {
      if (Array.isArray(req.body?.ids)) raw = req.body.ids;
      else if (typeof req.body?.ids === "string") raw = req.body.ids.split(",");
    }

    // normaliza, quita vacíos, únicos
    const ids = Array.from(
      new Set((raw || []).map((s) => String(s || "").trim()).filter(Boolean))
    );

    const validIds = ids.filter(isObjectId);
    if (validIds.length === 0) {
      return res.status(400).json({ error: "No valid ids", received: ids });
    }

    const prods = await Product.find({ _id: { $in: validIds } })
      .populate({ path: "variants.size", select: "label" })
      .populate({ path: "variants.color", select: "name" })
      .lean();

    // mantener orden y entregar shape público
    const map = new Map(prods.map((p) => [String(p._id), p]));
    const ordered = validIds
      .map((id) => map.get(id) || null)
      .filter(Boolean)
      .map(shapePublicProduct);

    return res.json(ordered);
  } catch (err) {
    if (err?.name === "CastError") {
      return res
        .status(400)
        .json({ error: "Invalid ObjectId in ids", details: err.message });
    }
    console.error("[/api/products/bulk] ERROR:", err);
    next(err);
  }
}

/** /bulk — acepta ids coma-separado y repetidos */
router.get("/bulk", productLimiter, bulkHandler);
router.post("/bulk", productLimiter, bulkHandler);

/** GET /public/:id — versión ligera para un solo producto */
router.get("/public/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id || "");
    if (!isObjectId(id)) return res.status(400).json({ error: "invalid id" });

    const p = await Product.findById(id)
      .populate({ path: "variants.size", select: "label" })
      .populate({ path: "variants.color", select: "name" })
      .lean();

    if (!p) return res.status(404).json({ error: "not found" });
    return res.json(shapePublicProduct(p));
  } catch (err) {
    next(err);
  }
});

/** Búsqueda pública / secciones */
router.get("/search", productLimiter, searchProducts);
router.get("/sections", productLimiter, getProductSections);

/* ===================== CRUD y endpoints existentes ===================== */
router.get("/", getProducts);
router.get("/:id", getProductById);

router.post(
  "/",
  productLimiter,
  verifyToken,
  isAdmin,
  uploadMiddleware,
  createUpdateValidators,
  createProduct
);

router.put(
  "/:id",
  productLimiter,
  verifyToken,
  isAdmin,
  uploadMiddleware,
  createUpdateValidators,
  updateProduct
);

router.delete("/:id", verifyToken, isAdmin, deleteProduct);

/* ===================== Historial / métricas ===================== */
router.get("/history/all", verifyToken, isAdmin, getProductEntryHistory); // no confl. con :id
router.get("/:id/history", verifyToken, isAdmin, getProductHistory);
router.get(
  "/:id/ledger",
  productLimiter,
  verifyToken,
  isAdmin,
  getVariantLedgerByProduct
);
router.get(
  "/:id/sales-history",
  productLimiter,
  verifyToken,
  isAdmin,
  getProductSalesHistory
);

module.exports = router;
