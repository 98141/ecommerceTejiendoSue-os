const express = require("express");
const { register, login } = require("../controllers/userController");
const { verifyToken, isAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// Ruta protegida para usuarios autenticados
router.get("/profile", verifyToken, (req, res) => {
  res.json({ message: "Perfil de usuario", user: req.user });
});

// Ruta protegida solo para admin
router.get("/admin-dashboard", verifyToken, isAdmin, (req, res) => {
  res.json({ message: "Bienvenido al panel de administrador" });
});

module.exports = router;
