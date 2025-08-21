const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return res.status(403).json({ error: "Token requerido" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    return next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido o expirado" }); // ← clave para refrescar
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res
    .status(403)
    .json({ error: "Acceso denegado: solo administradores" });
};

// Limita a 5 intentos cada 5 minutos
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: {
    error: "Demasiados intentos fallidos. Intenta nuevamente en unos minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { verifyToken, isAdmin, loginLimiter };
