const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");

const { verifyToken, onlyUsers } = require("../middleware/auth");
const maybeAuth = require("../middleware/maybeAuth");
const ctrl = require("../controllers/reviewController");
const {
  uploadReviewImages,
  processReviewImages,
} = require("../middleware/uploadReviewImages");

// Público (lee token si existe)
router.get("/product/:productId", maybeAuth, ctrl.listByProduct);

// Crear/editar mi reseña (texto + rating + imágenes opcionales)
const writeLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
});
const writeSlow = slowDown({ windowMs: 60_000, delayAfter: 5, delayMs: 200 });

router.post(
  "/product/:productId",
  verifyToken,
  onlyUsers,
  writeLimiter,
  writeSlow,
  uploadReviewImages,
  processReviewImages,
  ctrl.upsertMyReview
);

// Borrar mi reseña
router.delete(
  "/product/:productId",
  verifyToken,
  onlyUsers,
  ctrl.deleteMyReview
);

// Borrar reseña por id (admin o dueño)
router.delete("/:id", verifyToken, writeLimiter, writeSlow, ctrl.deleteReview);

module.exports = router;
