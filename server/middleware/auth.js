const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Token requerido" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ error: "Acceso denegado: solo administradores" });
  }
};

// Limita a 5 intentos cada 5 minutos
const loginLimiter = rateLimit({
  // 5 min
  windowMs: 5 * 60 * 1000, 
  // máximo de intentos
  max: 5, 
  message: { error: "Demasiados intentos fallidos. Intenta nuevamente en unos minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { verifyToken, isAdmin, loginLimiter };
