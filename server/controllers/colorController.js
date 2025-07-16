const Color = require("../models/Color");

exports.getColors = async (req, res) => {
  const colors = await Color.find().sort("name");
  res.json(colors);
};

exports.createColor = async (req, res) => {
  try {
    const { name } = req.body;
    const exists = await Color.findOne({ name });
    if (exists) return res.status(400).json({ error: "Color duplicado" });

    const newColor = new Color({ name });
    await newColor.save();
    res.status(201).json(newColor);
  } catch {
    res.status(500).json({ error: "Error al crear color" });
  }
};

exports.updateColor = async (req, res) => {
  try {
    const updated = await Color.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Color no encontrado" });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Error al actualizar color" });
  }
};

exports.deleteColor = async (req, res) => {
  try {
    const deleted = await Color.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Color no encontrado" });
    res.json({ message: "Color eliminado" });
  } catch {
    res.status(500).json({ error: "Error al eliminar color" });
  }
};
