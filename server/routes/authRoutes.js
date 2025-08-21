const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
//const loginRateLimiter = require("../middleware/loginRateLimiter");
const { loginLimiter } = require("../middleware/auth");

// Login seguro con límite de intentos
router.post("/login", loginLimiter, authController.login);

// Otros endpoints: register, logout, forgot-password, reset-password...
module.exports = router;
