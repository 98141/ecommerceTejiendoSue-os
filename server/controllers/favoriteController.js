const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");

exports.listFavorites = async (req, res) => {
  try {
    const populate = String(req.query.populate || "0") === "1";
    const user = await User.findById(req.user.id).select("favorites").lean();
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    const favIds = (Array.isArray(user.favorites) ? user.favorites : [])
      .map(String)
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (!favIds.length) {
      return populate
        ? res.json({ products: [] })
        : res.json({ productIds: [] });
    }

    if (!populate) return res.json({ productIds: favIds.map(String) });

    const now = new Date();
    const products = await Product.find({ _id: { $in: favIds } })
      .select("_id name price images discount")
      .lean();

    const shaped = products.map((p) => {
      const price = Number(p.price || 0);
      const d = p.discount || {};
      let effectivePrice = price;
      const inWindow =
        d.enabled &&
        (!d.startAt || now >= d.startAt) &&
        (!d.endAt || now <= d.endAt);

      if (inWindow) {
        effectivePrice =
          d.type === "PERCENT"
            ? price - (price * Number(d.value || 0)) / 100
            : price - Number(d.value || 0);
        effectivePrice = Math.max(0, Number(effectivePrice.toFixed(2)));
      }

      return {
        _id: p._id,
        name: p.name,
        price: p.price,
        effectivePrice,
        images: Array.isArray(p.images) ? p.images : [],
      };
    });

    res.json({ products: shaped });
  } catch (err) {
    console.error("Error en listFavorites:", err);
    res.status(500).json({ message: "Error al obtener favoritos" });
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
