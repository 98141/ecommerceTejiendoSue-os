const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");

const { verifyToken, onlyUsers } = require("../middleware/auth");
const maybeAuth = require("../middleware/maybeAuth");
const ctrl = require("../controllers/reviewController");

// Ver reseñas (público, pero si hay token lo leemos)
router.get("/product/:productId", maybeAuth, ctrl.listByProduct);

// Crear/editar mi reseña (solo usuarios)
const writeLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true });
const writeSlow = slowDown({ windowMs: 60_000, delayAfter: 5, delayMs: 200 });

router.post("/product/:productId", verifyToken, onlyUsers, writeLimiter, writeSlow, ctrl.upsertMyReview);

// Borrar reseña (dueño o admin)
router.delete("/:id", verifyToken, writeLimiter, writeSlow, ctrl.deleteReview);
router.delete("/product/:productId", verifyToken, onlyUsers, ctrl.deleteMyReview);

module.exports = router;
