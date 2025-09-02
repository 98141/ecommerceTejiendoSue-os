// routes/favoriteRoutes.js
const express = require("express");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const {
  listFavorites,
  addFavorite,
  removeFavorite,
  // bulkMergeFavorites,  // ❌ deja de usarse
} = require("../controllers/favoriteController");
const { verifyToken, onlyUsers } = require("../middleware/auth");

const router = express.Router();

const mutateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const mutateSlowdown = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 20,
  delayMs: (used, req) => (used - req.slowDown.limit) * 50,
  maxDelayMs: 1000,
});

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(verifyToken, onlyUsers);

router.get("/", readLimiter, listFavorites);
router.post("/:productId", mutateLimiter, mutateSlowdown, addFavorite);
router.delete("/:productId", mutateLimiter, mutateSlowdown, removeFavorite);

module.exports = router;
