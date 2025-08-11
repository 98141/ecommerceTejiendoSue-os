const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const ProductAudit = require("../models/ProductAudit");
const ProductEntryHistory = require("../models/ProductEntryHistory");
const { normalizeProductImagePath } = require("../utils/pathSafe");

// Helpers
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const toNumber = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
const parseJSON = (raw, fallback = null) => {
  try { return typeof raw === "string" ? JSON.parse(raw) : raw; }
  catch { return fallback; }
};

const buildDiscountFromBody = (body, basePrice) => {
  // Si llega como string JSON (recomendado desde frontend)
  let d = parseJSON(body.discount, null);
  if (!d) {
    // Alternativa: campos planos
    d = {
      enabled: body["discount[enabled]"] ?? body.discountEnabled,
      type: body["discount[type]"] ?? body.discountType,
      value: body["discount[value]"] ?? body.discountValue,
      startAt: body["discount[startAt]"] ?? body.discountStartAt,
      endAt: body["discount[endAt]"] ?? body.discountEndAt,
    };
  }

  if (!d) return { enabled: false, type: "PERCENT", value: 0, startAt: null, endAt: null };

  const enabled = !!(d.enabled === true || d.enabled === "true");
  const type = d.type === "FIXED" ? "FIXED" : "PERCENT";
  const value = toNumber(d.value, 0);
  const startAt = d.startAt ? new Date(d.startAt) : null;
  const endAt = d.endAt ? new Date(d.endAt) : null;

  // Validación cruzada servidor (seguridad)
  if (enabled) {
    if (type === "PERCENT") {
      if (!(value > 0 && value <= 90)) {
        throw new Error("Porcentaje inválido (1–90%).");
      }
    } else {
      if (!(value > 0 && value < basePrice)) {
        throw new Error("Descuento fijo inválido: debe ser > 0 y menor al precio.");
      }
    }
    if (startAt && endAt && endAt <= startAt) {
      throw new Error("La fecha fin debe ser posterior a la fecha de inicio.");
    }
  }

  return { enabled, type, value, startAt, endAt };
};

/** CREATE */
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, categories } = req.body;
    const rawVariants = req.body.variants;
    const basePrice = toNumber(price, -1);

    // Validaciones básicas
    if (!name || basePrice < 0) {
      return res.status(400).json({ error: "Campos obligatorios inválidos (nombre/precio)." });
    }

    // categoría única (según definición del proyecto)
    const categoryId = categories;
    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({ error: "Categoría inválida." });
    }

    if (!rawVariants) {
      return res.status(400).json({ error: "Debes incluir al menos una variante." });
    }

    const variantsIn = parseJSON(rawVariants, []);
    const variants = (Array.isArray(variantsIn) ? variantsIn : []).filter(
      (v) => isValidObjectId(v.size) && isValidObjectId(v.color) && Number(v.stock) >= 0
    );
    if (variants.length === 0) {
      return res.status(400).json({ error: "Las variantes no son válidas." });
    }

    // Descuento (opcional)
    let discount = { enabled: false, type: "PERCENT", value: 0, startAt: null, endAt: null };
    try {
      discount = buildDiscountFromBody(req.body, basePrice);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    // Imágenes
    const imagePaths = (req.files || []).map((file) => {
      const rel = `/uploads/products/${file.filename}`;
      return normalizeProductImagePath(rel);
    });

    const newProduct = new Product({
      name: String(name).trim(),
      description: description ? String(description).trim() : "",
      price: basePrice,
      categories: categoryId,
      images: imagePaths,
      variants,
      discount,
    });

    await newProduct.save();

    // Registrar entrada inicial (histórico)
    await ProductEntryHistory.create({
      productId: newProduct._id,
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price,
      categories: newProduct.categories,
      images: newProduct.images,
      variants: newProduct.variants.map((v) => ({
        size: v.size,
        color: v.color,
        initialStock: v.stock,
      })),
    });

    const obj = newProduct.toObject();
    obj.effectivePrice = newProduct.getEffectivePrice();
    return res.status(201).json(obj);
  } catch (err) {
    console.error("Error al crear producto:", err);
    return res.status(500).json({ error: "Error al crear producto" });
  }
};

/** READ ALL */
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("categories", "name")
      .populate("variants.size", "label")
      .populate("variants.color", "name");

    // Anexamos effectivePrice calculado por el servidor (fuente de verdad)
    const data = products.map((p) => {
      const obj = p.toObject();
      obj.effectivePrice = p.getEffectivePrice();
      return obj;
    });
    return res.json(data);
  } catch (err) {
    console.error("Error al obtener productos:", err);
    return res.status(500).json({ message: "Error al obtener productos" });
  }
};

/** READ ONE */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "ID inválido." });

    const product = await Product.findById(id)
      .populate("categories", "name")
      .populate("variants.size", "label")
      .populate("variants.color", "name");

    if (!product) return res.status(404).json({ error: "Producto no encontrado" });

    const obj = product.toObject();
    obj.effectivePrice = product.getEffectivePrice();
    return res.json(obj);
  } catch (err) {
    console.error("Error al buscar producto:", err);
    return res.status(500).json({ error: "Error al buscar producto" });
  }
};

/** UPDATE */
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const userId = req.user?.id;
    const {
      name,
      description,
      price,
      categories,
      variants: rawVariants,
    } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });

    const changes = {};

    // === Imágenes ===
    // Si el cliente no envía existingImages, conservamos todas las actuales
    let existingImagesArray;
    if (typeof req.body.existingImages === "undefined") {
      existingImagesArray = product.images.slice();
    } else {
      const existingImages = req.body.existingImages;
      existingImagesArray = Array.isArray(existingImages) ? existingImages : [existingImages].filter(Boolean);
    }

    const safeExisting = existingImagesArray
      .map(normalizeProductImagePath)
      .filter((p) => product.images.includes(p));

    const imagesToDelete = product.images.filter((img) => !safeExisting.includes(img));
    for (const imgPath of imagesToDelete) {
      const fullPath = path.join(process.cwd(), imgPath.replace(/^\//, ""));
      const safeBase = path.join(process.cwd(), "uploads", "products");
      if (fullPath.startsWith(safeBase) && fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch {}
      }
    }

    const newImages = (req.files || []).map((f) => normalizeProductImagePath(`/uploads/products/${f.filename}`));
    const finalImages = [...safeExisting, ...newImages];

    // === Campos básicos ===
    if (typeof name !== "undefined" && String(name).trim() !== product.name) {
      changes.name = { old: product.name, new: String(name).trim() };
      product.name = String(name).trim();
    }

    if (typeof description !== "undefined" && String(description).trim() !== product.description) {
      changes.description = { old: product.description, new: String(description).trim() };
      product.description = String(description).trim();
    }

    if (typeof price !== "undefined") {
      const newPrice = Number(price);
      if (!Number.isFinite(newPrice) || newPrice < 0) {
        return res.status(400).json({ error: "Precio inválido." });
      }
      if (newPrice !== product.price) {
        changes.price = { old: product.price, new: newPrice };
        product.price = newPrice;
      }
    }

    if (typeof categories !== "undefined") {
      if (!mongoose.Types.ObjectId.isValid(categories)) {
        return res.status(400).json({ error: "Categoría inválida." });
      }
      if (String(categories) !== String(product.categories)) {
        changes.categories = { old: product.categories, new: categories };
        product.categories = categories;
      }
    }

    // === Variantes ===
    // SOLO tocar si el cliente envió 'variants'
    if (typeof rawVariants !== "undefined") {
      const parsed = typeof rawVariants === "string" ? JSON.parse(rawVariants) : rawVariants;
      const validVariants = (Array.isArray(parsed) ? parsed : []).filter(
        (v) =>
          mongoose.Types.ObjectId.isValid(v.size) &&
          mongoose.Types.ObjectId.isValid(v.color) &&
          Number(v.stock) >= 0
      );
      product.variants = validVariants;
      // (Opcional: puedes auditar variantes si lo necesitas)
    }

    // === Descuento ===
    // SOLO validar/aplicar si el cliente envió 'discount' (JSON) o campos planos de discount
    const hasDiscountPayload =
      typeof req.body.discount !== "undefined" ||
      typeof req.body["discount[enabled]"] !== "undefined" ||
      typeof req.body.discountEnabled !== "undefined";

    if (hasDiscountPayload) {
      let newDiscount;
      try {
        const basePrice = typeof price !== "undefined" ? Number(price) : product.price;
        newDiscount = buildDiscountFromBody(req.body, basePrice);
      } catch (e) {
        return res.status(400).json({ error: e.message });
      }

      const discountChanged = JSON.stringify(product.discount || {}) !== JSON.stringify(newDiscount || {});
      if (discountChanged) {
        changes.discount = { old: product.discount || {}, new: newDiscount };
        product.discount = newDiscount;
      }
    }

    // Aplicar imágenes al final
    product.images = finalImages;

    await product.save();

    if (userId && Object.keys(changes).length > 0) {
      await ProductAudit.create({
        product: product._id,
        user: userId,
        action: "updated",
        changes,
      });
    }

    const obj = product.toObject();
    obj.effectivePrice = product.getEffectivePrice();
    return res.json(obj);
  } catch (err) {
    console.error("Error al actualizar producto:", err);
    return res.status(500).json({ error: "Error al actualizar producto" });
  }
};


/** DELETE */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "ID inválido." });

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Producto no encontrado" });

    // Borrado físico de imágenes (best effort, dentro del directorio seguro)
    for (const imgPath of deleted.images || []) {
      const fullPath = path.join(process.cwd(), imgPath.replace(/^\//, ""));
      if (fullPath.startsWith(path.join(process.cwd(), "uploads", "products"))) {
        if (fs.existsSync(fullPath)) {
          try { fs.unlinkSync(fullPath); } catch {}
        }
      }
    }

    return res.json({ message: "Producto eliminado correctamente" });
  } catch (err) {
    console.error("Error al eliminar producto:", err);
    return res.status(500).json({ error: "Error al eliminar producto" });
  }
};

/** AUDITORÍA (LISTADO) */
exports.getProductHistory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "ID inválido." });

    const audits = await ProductAudit.find({ product: id })
      .populate("user", "name email")
      .sort({ timestamp: -1 });

    return res.json(audits);
  } catch (err) {
    console.error("Error al obtener historial del producto:", err);
    return res.status(500).json({ error: "Error al obtener historial del producto" });
  }
};

/** ENTRADAS INICIALES (LISTADO) */
exports.getProductEntryHistory = async (req, res) => {
  try {
    const history = await ProductEntryHistory.find()
      .populate("categories", "name")
      .populate("variants.size", "label")
      .populate("variants.color", "name")
      .sort({ createdAt: -1 });

    return res.json(history);
  } catch (err) {
    console.error("Error al obtener historial:", err);
    return res.status(500).json({ error: "Error al obtener historial de productos" });
  }
};
