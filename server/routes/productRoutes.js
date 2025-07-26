const express = require("express");
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
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const productLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Demasiadas solicitudes, intenta más tarde.",
});

router.get("/", getProducts);
router.get("/:id", getProductById);

router.post("/", verifyToken, isAdmin, uploadMiddleware, createProduct);

router.put(
  "/:id",
  productLimiter,
  verifyToken,
  isAdmin,
  uploadMiddleware,
  [
    body("name").trim().escape(),
    body("description").trim().escape(),
    body("price").isFloat({ min: 0 }),
    body("stock").isInt({ min: 0 }),
    body("categories").optional().trim().escape(),
  ],
  updateProduct
);

router.delete("/:id", verifyToken, isAdmin, deleteProduct);
router.get("/:id/history", verifyToken, isAdmin, getProductHistory);
router.get("/history/all", verifyToken, isAdmin, getProductEntryHistory);

module.exports = router;
