const express = require("express");
const router = express.Router();
const { getDashboardSummary } = require("../controllers/dashboardController");
const { verifyToken, isAdmin } = require("../middleware/auth");

router.get("/summary", verifyToken, isAdmin, getDashboardSummary);

module.exports = router;
