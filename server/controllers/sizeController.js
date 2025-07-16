const Size = require("../models/Size");

exports.getSizes = async (req, res) => {
  const sizes = await Size.find().sort("label");
  res.json(sizes);
};

exports.createSize = async (req, res) => {
  try {
    const { label } = req.body;
    const exists = await Size.findOne({ label });
    if (exists) return res.status(400).json({ error: "Talla duplicada" });

    const newSize = new Size({ label });
    await newSize.save();
    res.status(201).json(newSize);
  } catch (err) {
    res.status(500).json({ error: "Error al crear talla" });
  }
};

exports.updateSize = async (req, res) => {
  try {
    const updated = await Size.findByIdAndUpdate(
      req.params.id,
      { label: req.body.label },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Talla no encontrada" });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Error al actualizar talla" });
  }
};

exports.deleteSize = async (req, res) => {
  try {
    const deleted = await Size.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Talla no encontrada" });
    res.json({ message: "Talla eliminada" });
  } catch {
    res.status(500).json({ error: "Error al eliminar talla" });
  }
};
