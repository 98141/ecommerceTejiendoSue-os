const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");
const ProductAudit = require("../models/ProductAudit");
const ProductEntryHistory = require("../models/ProductEntryHistory");

/** Normaliza category a UN solo ObjectId (si te llega array o CSV, toma el primero) */
function normalizeCategory(categories) {
  if (!categories) return undefined;
  if (Array.isArray(categories)) return categories[0];
  if (typeof categories === "string") {
    const parts = categories.split(",").map(s => s.trim()).filter(Boolean);
    return parts[0] || categories;
  }
  return categories;
}

/** Parsea variantes desde string o array y valida estructura mínima */
function parseVariants(raw) {
  let arr = [];
  if (!raw) return arr;
  try {
    arr = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    arr = [];
  }
  return (Array.isArray(arr) ? arr : []).filter(
    v => v && v.size && v.color && Number(v.stock) >= 0
  );
}

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const categoryId = normalizeCategory(req.body.categories);
    const validVariants = parseVariants(req.body.variants);

    if (!validVariants.length) {
      return res.status(400).json({ error: "Debes incluir al menos una variante válida" });
    }

    const imagePaths = (req.files || []).map(file => `/uploads/products/${file.filename}`);

    const newProduct = new Product({
      name,
      description,
      price,
      categories: categoryId,     // UNA categoría
      images: imagePaths,
      variants: validVariants,
    });

    await newProduct.save();

    // Historial: CREACIÓN con todas las variantes (stock inicial)
    await ProductEntryHistory.create({
      productId: newProduct._id,
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price,
      categories: newProduct.categories,
      images: newProduct.images,
      variants: newProduct.variants.map(v => ({
        size: v.size,
        color: v.color,
        initialStock: v.stock,
      })),
      kind: "CREATE",
      note: "",
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Error al crear producto:", err);
    res.status(500).json({ error: "Error al crear producto" });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("categories", "name")
      .populate("variants.size", "label")
      .populate("variants.color", "name");
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener productos" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("categories", "name")
      .populate("variants.size", "label")
      .populate("variants.color", "name");
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Error al buscar producto" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user?.id;

    const {
      name,
      description,
      price,
      categories,
      existingImages = [],
      variants: rawVariants,
    } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Producto no encontrado" });

    // --- Imagenes: conservar existentes + agregar nuevas ---
    const existingImagesArray = Array.isArray(existingImages) ? existingImages : [existingImages].filter(Boolean);

    // borrar físicas (best-effort) las que se quitan
    const imagesToDelete = product.images.filter(img => !existingImagesArray.includes(img));
    for (const imgPath of imagesToDelete) {
      try {
        const safePath = path.join(process.cwd(), imgPath.replace(/^\//, ""));
        const safeBase = path.join(process.cwd(), "uploads", "products");
        if (safePath.startsWith(safeBase) && fs.existsSync(safePath)) fs.unlinkSync(safePath);
      } catch {}
    }

    const newImages = (req.files || []).map(file => `/uploads/products/${file.filename}`);
    const finalImages = [...existingImagesArray, ...newImages];

    // --- Snapshot previo para detectar eventos ---
    const prevVariantsSet = new Set((product.variants || []).map(v => `${String(v.size)}::${String(v.color)}`));
    const prevPrice = product.price;

    // --- Variantes (solo si se envían) ---
    let addedVariants = [];
    if (typeof rawVariants !== "undefined") {
      const validVariants = parseVariants(rawVariants);
      addedVariants = validVariants.filter(v => !prevVariantsSet.has(`${String(v.size)}::${String(v.color)}`));
      product.variants = validVariants;
    }

    // --- Cambios auditables ---
    const changes = {};

    if (typeof name !== "undefined" && name !== product.name) {
      changes.name = { old: product.name, new: name };
      product.name = name;
    }
    if (typeof description !== "undefined" && description !== product.description) {
      changes.description = { old: product.description, new: description };
      product.description = description;
    }
    if (typeof price !== "undefined" && Number(price) !== Number(product.price)) {
      changes.price = { old: product.price, new: Number(price) };
      product.price = Number(price);
    }

    if (typeof categories !== "undefined") {
      const newCat = normalizeCategory(categories);
      if (newCat && String(newCat) !== String(product.categories)) {
        changes.categories = { old: product.categories, new: newCat };
        product.categories = newCat;
      }
    }

    // aplicar imágenes
    product.images = finalImages;

    // --- Guardar producto ---
    await product.save();

    // --- Auditoría (si hubiera cambios) ---
    if (userId && Object.keys(changes).length > 0) {
      await ProductAudit.create({
        product: product._id,
        user: userId,
        action: "updated",
        changes,
      });
    }

    // === Entradas de HISTORIAL por eventos ===

    // Variantes añadidas
    if (Array.isArray(addedVariants) && addedVariants.length > 0) {
      await ProductEntryHistory.create({
        productId: product._id,
        name: product.name,
        description: product.description,
        price: product.price,               // precio vigente
        categories: product.categories,
        images: product.images,
        variants: addedVariants.map(v => ({
          size: v.size,
          color: v.color,
          initialStock: v.stock
        })),
        kind: "UPDATE_VARIANTS",
        note: "Se añadieron variantes"
      });
    }

    // Cambio de precio
    if (typeof changes.price !== "undefined" && changes.price.new !== changes.price.old) {
      await ProductEntryHistory.create({
        productId: product._id,
        name: product.name,
        description: product.description,
        price: product.price,               // nuevo precio
        categories: product.categories,
        images: product.images,
        variants: [],                       // no aplica variantes
        kind: "UPDATE_PRICE",
        note: `Precio anterior: ${prevPrice}, nuevo: ${product.price}`
      });
    }

    res.json(product);
  } catch (err) {
    console.error("Error al actualizar producto:", err);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ message: "Producto eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar producto" });
  }
};

exports.getProductHistory = async (req, res) => {
  try {
    const audits = await ProductAudit.find({ product: req.params.id })
      .populate("user", "name email")
      .sort({ timestamp: -1 });
    res.json(audits);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener historial del producto" });
  }
};

exports.getProductEntryHistory = async (req, res) => {
  try {
    const history = await ProductEntryHistory.find()
      .populate("categories", "name")
      .populate("variants.size", "label")
      .populate("variants.color", "name")
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    console.error("Error al obtener historial:", err);
    res.status(500).json({ error: "Error al obtener historial de productos" });
  }
};

