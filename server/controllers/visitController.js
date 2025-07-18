const Visit = require("../models/Visit");

exports.getVisits = async (req, res) => {
  try {
    let visitDoc = await Visit.findOne();
    if (!visitDoc) visitDoc = await Visit.create({});
    res.json({ count: visitDoc.count });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener visitas" });
  }
};

exports.incrementVisit = async (req, res) => {
  try {
    let visitDoc = await Visit.findOne();
    if (!visitDoc) visitDoc = await Visit.create({});
    visitDoc.count += 1;
    await visitDoc.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Error al incrementar visitas" });
  }
};
