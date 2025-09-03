// routes/userRoutes.js
const express = require("express");
const userController = require("../controllers/userController");
const { verifyToken, isAdmin, loginLimiter } = require("../middleware/auth");

const router = express.Router();

/**
 * 📌 RUTAS PÚBLICAS (no requieren token)
 */
router.post("/register", userController.register);                  
router.post("/login", loginLimiter, userController.login);          
router.post("/logout", userController.logout);                      
router.get("/refresh-token", userController.refreshToken);          
router.get("/verify/:token", userController.verifyEmail);           
router.post("/resend-verification", userController.resendVerification); 
router.post("/forgot-password", userController.forgotPassword);     
router.post("/reset-password/:token", userController.resetPassword);

/**
 * 🔒 RUTAS PROTEGIDAS (requieren token válido)
 */
router.get("/profile", verifyToken, (req, res) => {
  res.json({ message: "Perfil de usuario", user: req.user });
});

router.get("/admin-dashboard", verifyToken, isAdmin, (req, res) => {
  res.json({ message: "Bienvenido al panel de administrador" });
});

router.get("/me", verifyToken, userController.getMe);

module.exports = router;
