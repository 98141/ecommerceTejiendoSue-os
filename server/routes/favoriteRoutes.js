const router = require("express").Router();
const rl = require("express-rate-limit");
const slowDown = require("express-slow-down");
const { listFavorites, addFavorite, removeFavorite } = require("../controllers/favoriteController");
const { verifyToken, onlyUsers } = require("../middleware/auth");

// 🔐 Aplica verificación de token a todas las rutas
router.use(verifyToken, onlyUsers);

// 📌 Limitador de peticiones
const rateLimiter = rl({
  windowMs: 60 * 1000, // 1 minuto
  max: 60              // máximo 60 requests por minuto
});

// 🐢 Limitador de velocidad progresivo
const speedLimiter = slowDown({
  windowMs: 60 * 1000, // 1 minuto
  delayAfter: 20,      // después de 20 requests empieza a aplicar delay
  delayMs: 50          // cada request extra añade 50ms de retraso
});

// 📌 Rutas de favoritos
router.get("/", 
  rl({ windowMs: 60 * 1000, max: 600 }), 
  listFavorites
);

router.post("/:productId", 
  rateLimiter, 
  speedLimiter, 
  addFavorite
);

router.delete("/:productId", 
  rateLimiter, 
  speedLimiter, 
  removeFavorite
);

module.exports = router;

