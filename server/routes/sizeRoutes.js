const express = require("express");
const router = express.Router();
const {
  getSizes,
  createSize,
  updateSize,
  deleteSize
} = require("../controllers/sizeController");

const { verifyToken, isAdmin } = require("../middleware/auth");

router.get("/", getSizes);
router.post("/", verifyToken, isAdmin, createSize);
router.put("/:id", verifyToken, isAdmin, updateSize);
router.delete("/:id", verifyToken, isAdmin, deleteSize);

module.exports = router;
