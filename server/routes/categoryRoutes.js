const express = require("express");
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,   
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Protegidas admin
router.post("/", verifyToken, isAdmin, createCategory);
router.put("/:id", verifyToken, isAdmin, updateCategory);
router.delete("/:id", verifyToken, isAdmin, deleteCategory);

// Públicas
router.get("/", getAllCategories);
router.get("/slug/:slug", getCategoryBySlug); // <— nuevo
router.get("/:id", getCategoryById);

module.exports = router;
