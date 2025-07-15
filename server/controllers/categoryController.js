const Category = require("../models/Category");

// 📌 Crear una nueva categoría
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ error: "La categoría ya existe." });
    }

    const category = new Category({ name, description });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    console.error("Error al crear categoría:", err);
    res.status(500).json({ error: "Error al crear la categoría" });
  }
};

// 📌 Obtener todas las categorías
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener categorías" });
  }
};

// 📌 Obtener una categoría por ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: "Error al buscar categoría" });
  }
};

// 📌 Actualizar categoría
exports.updateCategory = async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Error al actualizar la categoría" });
  }
};

// 📌 Eliminar categoría
exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json({ message: "Categoría eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar la categoría" });
  }
};
