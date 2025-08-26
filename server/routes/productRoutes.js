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

const { searchProducts, getProductSections } = require("../controllers/productSearchController");

const Product = require("../models/Product"); 
const { verifyToken, isAdmin } = require("../middleware/auth");
const uploadMiddleware = require("../middleware/uploadMiddleware");

const router = express.Router();

const productLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Demasiadas solicitudes, intenta más tarde.",
});

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

/* ===================== Helpers "public shape" ===================== */

function computeEffectivePrice(p, now = new Date()) {
  const price = Number(p.price) || 0;
  const d = p.discount || {};
  if (!d.enabled) return price;
  const start = d.startAt ? new Date(d.startAt) : null;
  const end = d.endAt ? new Date(d.endAt) : null;
  if (start && now < start) return price;
  if (end && now > end) return price;

  let eff = price;
  if (d.type === "PERCENT") {
    eff = price - (price * (Number(d.value) || 0)) / 100;
  } else {
    eff = price - (Number(d.value) || 0);
  }
  if (eff < 0) eff = 0;
  return Number(eff.toFixed(2));
}

function shapePublicProduct(p) {
  // Devuelve lo necesario para el carrito/tienda (ligero y consistente)
  return {
    _id: p._id,
    name: p.name,
    price: p.price,
    effectivePrice: computeEffectivePrice(p),
    images: Array.isArray(p.images) ? p.images : [],
    // Solo lo esencial de variantes con labels ya poblados
    variants: Array.isArray(p.variants)
      ? p.variants.map((v) => ({
          size: v.size
            ? { _id: v.size._id || v.size, label: v.size.label }
            : null,
          color: v.color
            ? { _id: v.color._id || v.color, name: v.color.name }
            : null,
          stock: typeof v.stock === "number" ? v.stock : 0,
        }))
      : [],
  };
}

/* ====================== Validadores existentes ====================== */

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

/* ======================= Rutas PÚBLICAS NUEVAS ======================= */
/**
 * ⚠️ IMPORTANTE: /bulk DEBE IR ANTES de "/:id" o Express lo capturará como id="bulk".
 */

// GET /api/products/bulk?ids=1,2,3
router.get("/bulk", async (req, res, next) => {
  try {
    const idsParam = String(req.query.ids || "");
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    const ok = ids.filter((id) => /^[0-9a-fA-F]{24}$/.test(id));
    if (!ok.length) return res.json([]);

    const prods = await Product.find({ _id: { $in: ok } })
      .populate({ path: "variants.size", select: "label" })
      .populate({ path: "variants.color", select: "name" })
      .lean();

    return res.json(prods.map(shapePublicProduct));
  } catch (err) {
    next(err);
  }
});

// GET /api/products/public/:id  (opcional como fallback single)
router.get("/public/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id || "");
    if (!/^[0-9a-fA-F]{24}$/.test(id))
      return res.status(400).json({ error: "invalid id" });

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

router.get("/search", productLimiter, searchProducts);

router.get("/sections", productLimiter, getProductSections);

/* ===================== Rutas existentes ===================== */

// Listado y detalle (controladores existentes)
router.get("/", getProducts);
router.get("/:id", getProductById);

// Crear
router.post(
  "/",
  productLimiter,
  verifyToken,
  isAdmin,
  uploadMiddleware,
  createUpdateValidators,
  createProduct
);

// Actualizar
router.put(
  "/:id",
  productLimiter,
  verifyToken,
  isAdmin,
  uploadMiddleware,
  createUpdateValidators,
  updateProduct
);

// Eliminar
router.delete("/:id", verifyToken, isAdmin, deleteProduct);

// Historial
router.get("/:id/history", verifyToken, isAdmin, getProductHistory);
router.get("/history/all", verifyToken, isAdmin, getProductEntryHistory);

// Ledger por producto
router.get(
  "/:id/ledger",
  productLimiter,
  verifyToken,
  isAdmin,
  getVariantLedgerByProduct
);

// Ventas por producto
router.get(
  "/:id/sales-history",
  productLimiter,
  verifyToken,
  isAdmin,
  getProductSalesHistory
);

module.exports = router;
