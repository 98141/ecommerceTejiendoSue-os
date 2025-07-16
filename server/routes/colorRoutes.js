const express = require("express");
const router = express.Router();
const {
  getColors,
  createColor,
  updateColor,
  deleteColor
} = require("../controllers/colorController");

const { verifyToken, isAdmin } = require("../middleware/auth");

router.get("/", getColors);
router.post("/", verifyToken, isAdmin, createColor);
router.put("/:id", verifyToken, isAdmin, updateColor);
router.delete("/:id", verifyToken, isAdmin, deleteColor);

module.exports = router;
