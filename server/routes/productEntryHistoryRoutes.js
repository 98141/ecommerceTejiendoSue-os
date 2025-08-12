const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/productEntryHistoryController");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Export (CSV/PDF)
router.get("/history/export", verifyToken, isAdmin, ctrl.exportHistory);

// Lista paginada + filtros
router.get("/history", verifyToken, isAdmin, ctrl.listHistory);

// Detalle
router.get("/history/:id", verifyToken, isAdmin, ctrl.getHistoryById);



module.exports = router;
