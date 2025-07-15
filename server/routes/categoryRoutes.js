const express = require("express");
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const { verifyToken, isAdmin } = require("../middleware/auth");

// 📌 Rutas protegidas solo para admin
router.post("/", verifyToken, isAdmin, createCategory);
router.put("/:id", verifyToken, isAdmin, updateCategory);
router.delete("/:id", verifyToken, isAdmin, deleteCategory);

// 📌 Rutas públicas
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

module.exports = router;
