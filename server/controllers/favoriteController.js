const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");

const toObjectId = (v) => {
  const s = String(v || "");
  return mongoose.Types.ObjectId.isValid(s) ? new mongoose.Types.ObjectId(s) : null;
};

const toDateOrNull = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

exports.listFavorites = async (req, res) => {
  try {
    const populate = String(req.query.populate || "0") === "1";

    const u = await User.findById(req.user.id).select("favorites").lean();
    if (!u) return res.status(404).json({ message: "Usuario no encontrado" });

    const rawFavs = Array.isArray(u.favorites) ? u.favorites : [];
    const favIds = rawFavs.map(toObjectId).filter(Boolean);

    // DEBUG: qué le llega al servidor
    console.log("[favorites] user:", req.user.id, "rawFavs:", rawFavs, "favIds(valid):", favIds.length);

    if (!favIds.length) {
      return populate ? res.json({ products: [] }) : res.json({ productIds: [] });
    }

    if (!populate) return res.json({ productIds: favIds.map(String) });

    // Busca productos; si falla por cualquier razón, no rompes la ruta
    let products = [];
    try {
      products = await Product.find({ _id: { $in: favIds } })
        .select("_id name price images discount")
        .lean();
    } catch (e) {
      console.error("Error consultando productos favoritos:", e);
      // Devolver vacío evita el 500 y la UI sigue viva
      return res.json({ products: [] });
    }

    const now = new Date();
    const shaped = [];

    for (const p of products) {
      try {
        const price = Number(p?.price || 0);
        const d = p?.discount || {};
        const start = toDateOrNull(d.startAt);
        const end = toDateOrNull(d.endAt);

        const inWindow = !!d.enabled && (!start || now >= start) && (!end || now <= end);

        let effectivePrice = price;
        if (inWindow) {
          effectivePrice =
            d.type === "PERCENT"
              ? price - (price * Number(d.value || 0)) / 100
              : price - Number(d.value || 0);
          effectivePrice = Math.max(0, Number(effectivePrice.toFixed(2)));
        }

        shaped.push({
          _id: p._id,
          name: p.name,
          price,
          effectivePrice,
          images: Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []),
        });
      } catch (e) {
        // Si un producto viene raro, lo ignoramos
        console.warn("Producto favorito omitido por error de shape:", p?._id, e?.message);
      }
    }

    return res.json({ products: shaped });
  } catch (err) {
    console.error("Error en listFavorites (capa exterior):", err);
    return res.status(500).json({ message: "Error al obtener favoritos" });
  }
};

// ➕ Agregar a favoritos
exports.addFavorite = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "ID de producto inválido" });
    }

    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    if (!user.favorites.includes(productId)) {
      user.favorites.push(productId);
      await user.save();
    }

    res.json({
      message: "Producto agregado a favoritos",
      favorites: user.favorites,
    });
  } catch (err) {
    console.error("Error en addFavorite:", err);
    res.status(500).json({ message: "Error al agregar a favoritos" });
  }
};

// ❌ Eliminar de favoritos
exports.removeFavorite = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "ID de producto inválido" });
    }

    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    user.favorites = user.favorites.filter(
      (favId) => favId.toString() !== productId
    );
    await user.save();

    res.json({
      message: "Producto eliminado de favoritos",
      favorites: user.favorites,
    });
  } catch (err) {
    console.error("Error en removeFavorite:", err);
    res.status(500).json({ message: "Error al eliminar de favoritos" });
  }
};
