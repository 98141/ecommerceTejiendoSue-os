const express = require("express");
const {
  register,
  login,
  refreshToken,
  verifyEmail,
  resendVerification 
} = require("../controllers/userController");
const { verifyToken, isAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/refresh-token", refreshToken);
router.get("/verify/:token", verifyEmail);
router.get("/resend-verification", resendVerification);

// Ruta protegida para usuarios autenticados
router.get("/profile", verifyToken, (req, res) => {
  res.json({ message: "Perfil de usuario", user: req.user });
});

// Ruta protegida solo para admin
router.get("/admin-dashboard", verifyToken, isAdmin, (req, res) => {
  res.json({ message: "Bienvenido al panel de administrador" });
});

router.get("/admin/id", verifyToken, isAdmin, async (req, res) => {
  try {
    const admin = await User.findOne({ role: "admin" });
    if (!admin) return res.status(404).json({ error: "Admin no encontrado" });
    res.json({ adminId: admin._id });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener admin ID" });
  }
});

module.exports = router;
