const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const loginRateLimiter = require("../middleware/loginRateLimiter");

// Login seguro con límite de intentos
router.post("/login", loginRateLimiter, authController.login);

// Otros endpoints: register, logout, forgot-password, reset-password...
module.exports = router;
