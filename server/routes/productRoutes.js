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
  getProductEntryHistory
} = require("../controllers/productController");

const { verifyToken, isAdmin } = require("../middleware/auth");
const uploadMiddleware = require("../middleware/uploadMiddleware");

const router = express.Router();

const productLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Demasiadas solicitudes, intenta más tarde.",
});

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

/** Validadores comunes (evitamos escapar en BD; sanitizamos y validamos) */
const createUpdateValidators = [
  body("name").optional().isString().trim().isLength({ min: 1, max: 200 }),
  body("description").optional().isString().trim().isLength({ max: 5000 }),
  body("price").optional().isFloat({ min: 0 }),

  // single category
  body("categories").optional().custom(v => {
    if (!isObjectId(v)) throw new Error("Categoría inválida.");
    return true;
  }),

  // variants llegará en JSON string
  body("variants").optional().custom((raw) => {
    try {
      const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!Array.isArray(arr)) throw new Error();
      for (const v of arr) {
        if (!isObjectId(v.size) || !isObjectId(v.color)) throw new Error("Variante inválida (size/color).");
        if (!(Number(v.stock) >= 0)) throw new Error("Variante inválida (stock).");
      }
      return true;
    } catch {
      throw new Error("Formato de variantes inválido.");
    }
  }),

  // descuento si llega con campos planos (si llega JSON en req.body.discount, se valida en el controller)
  body("discount[enabled]").optional().isIn(["true", "false"]),
  body("discount[type]").optional().isIn(["PERCENT", "FIXED"]),
  body("discount[value]").optional().isFloat({ min: 0 }),
  body("discount[startAt]").optional().isISO8601(),
  body("discount[endAt]").optional().isISO8601(),
];

/** Rutas */
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

router.get("/:id/history", verifyToken, isAdmin, getProductHistory);
router.get("/history/all", verifyToken, isAdmin, getProductEntryHistory);

module.exports = router;
