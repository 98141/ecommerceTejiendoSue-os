const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.listFavorites = async (req, res) => {
  const populate = String(req.query.populate || "0") === "1";
  const user = await User.findById(req.user.id).select("favorites").lean();
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  if (!populate) return res.json({ productIds: user.favorites });

  const products = await Product.find({ _id: { $in: user.favorites } })
    .select("_id name price images discount") // devolvemos campos mínimos
    .lean();

  // calcular precio efectivo de forma consistente (igual que tus helpers)
  const now = new Date();
  const shape = (p) => {
    const price = Number(p?.price) || 0;
    const d = p?.discount || {};
    let effectivePrice = price;
    if (d.enabled) {
      const start = d.startAt ? new Date(d.startAt) : null;
      const end = d.endAt ? new Date(d.endAt) : null;
      if (!(start && now < start) && !(end && now > end)) {
        effectivePrice =
          d.type === "PERCENT"
            ? price - (price * (Number(d.value) || 0)) / 100
            : price - (Number(d.value) || 0);
        effectivePrice = Number(Math.max(0, effectivePrice).toFixed(2));
      }
    }
    return {
      _id: p._id,
      name: p.name,
      price: p.price,
      effectivePrice,
      images: Array.isArray(p.images) ? p.images : [],
    };
  };

  const shaped = products.map(shape);
  return res.json({ products: shaped });
};

exports.addFavorite = async (req, res) => {
  const { productId } = req.params;
  if (!isValidId(productId))
    return res.status(400).json({ message: "productId inválido" });

  const exists = await Product.exists({ _id: productId });
  if (!exists) return res.status(404).json({ message: "Producto no existe" });

  await User.updateOne(
    { _id: req.user.id },
    { $addToSet: { favorites: productId } }
  );

  return res.status(201).json({ message: "Agregado a favoritos", productId });
};

exports.removeFavorite = async (req, res) => {
  const { productId } = req.params;
  if (!isValidId(productId))
    return res.status(400).json({ message: "productId inválido" });

  await User.updateOne(
    { _id: req.user.id },
    { $pull: { favorites: productId } }
  );

  return res.status(204).send();
};

// Fusión de favoritos (opcional): cuando el usuario tenía favoritos en localStorage
exports.bulkMergeFavorites = async (req, res) => {
  const { productIds } = req.body;
  if (!Array.isArray(productIds)) {
    return res.status(400).json({ message: "productIds debe ser un array" });
  }
  const valids = productIds.filter(isValidId);
  if (!valids.length) return res.json({ merged: [] });

  const existingIds = (
    await Product.find({ _id: { $in: valids } }).select("_id").lean()
  ).map((p) => p._id);

  if (existingIds.length) {
    await User.updateOne(
      { _id: req.user.id },
      { $addToSet: { favorites: { $each: existingIds } } }
    );
  }
  return res.json({ merged: existingIds });
};
