const express = require("express");
const rateLimit = require("express-rate-limit");
const { verifyToken, isAdmin } = require("../middleware/auth");
const { getSummary } = require("../controllers/dashboardController");

const router = express.Router();

const dashboardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: "Demasiadas solicitudes de dashboard. Intenta en un minuto.",
});

router.get("/summary", dashboardLimiter, verifyToken, isAdmin, getSummary);

module.exports = router;
