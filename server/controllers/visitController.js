const Visit = require("../models/Visit");

exports.incrementVisit = async (req, res) => {
  try {
    const doc = await Visit.findOneAndUpdate(
      {},
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    res.json({ count: doc.count });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar visitas" });
  }
};

exports.getVisits = async (req, res) => {
  try {
    const doc = await Visit.findOne({});
    res.json({ count: doc?.count || 0 });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener visitas" });
  }
};
