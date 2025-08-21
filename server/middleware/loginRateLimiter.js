const rateLimit = require("express-rate-limit");

const loginRateLimiter = rateLimit({
  // 5 minutos
  windowMs: 5 * 60 * 1000, 
  // máximo 5 intentos
  max: 5, 
  message: {
    error: "Demasiados intentos fallidos. Intenta de nuevo en 5 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = loginRateLimiter;
