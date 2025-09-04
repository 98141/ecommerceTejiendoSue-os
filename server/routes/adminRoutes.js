const express = require("express");
const rateLimit = require("express-rate-limit");
const { verifyToken, isAdmin } = require("../middleware/auth");
const {
  listUsers,
  resendVerificationForUser,
} = require("../controllers/adminController");

const router = express.Router();
router.use(verifyToken, isAdmin);

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

// Listado con filtros/paginación
router.get("/users", readLimiter, listUsers);

// Reenviar verificación a un usuario
router.post(
  "/users/:id/resend-verification",
  writeLimiter,
  resendVerificationForUser
);

module.exports = router;
