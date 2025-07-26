const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");
const ProductAudit = require("../models/ProductAudit");
const ProductEntryHistory = require("../models/ProductEntryHistory");

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, categories } = req.body;
    const rawVariants = req.body.variants;

    // Validación inicial
    if (!rawVariants) {
      return res
        .status(400)
        .json({ error: "Debes incluir al menos una variante" });
    }

    const variants = JSON.parse(rawVariants);

    // Validar variantes
    const validVariants = variants.filter(
      (v) => v.size && v.color && Number(v.stock) >= 0
    );

    if (validVariants.length === 0) {
      return res.status(400).json({ error: "Las variantes no son válidas" });
    }

    const imagePaths = req.files.map(
      (file) => `/uploads/products/${file.filename}`
    );

    const newProduct = new Product({
      name,
      description,
      price,
      categories: Array.isArray(categories)
        ? categories
        : categories.split(","),
      images: imagePaths,
      variants: validVariants,
    });

    await newProduct.save();

    const historyEntry = new ProductEntryHistory({
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

    await historyEntry.save();

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
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ error: "Producto no encontrado" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Error al buscar producto" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user.id; // ← este valor debe venir del middleware `verifyToken`

    const {
      name,
      description,
      price,
      categories,
      existingImages = [],
      variants: rawVariants,
    } = req.body;

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ error: "Producto no encontrado" });

    // === Imagen: lógica igual a la tuya ===
    const existingImagesArray = Array.isArray(existingImages)
      ? existingImages
      : [existingImages];

    const imagesToDelete = product.images.filter(
      (img) => !existingImagesArray.includes(img)
    );

    for (const imgPath of imagesToDelete) {
      const fullPath = path.join(__dirname, "..", imgPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    const newImages = req.files.map(
      (file) => `/uploads/products/${file.filename}`
    );
    const finalImages = [...existingImagesArray, ...newImages];

    // === Variantes ===
    let parsedVariants = [];
    if (rawVariants) {
      parsedVariants = JSON.parse(rawVariants);
    }

    const validVariants = parsedVariants.filter(
      (v) => v.size && v.color && Number(v.stock) >= 0
    );

    // === Auditoría de cambios ===
    const changes = {};
    if (name !== undefined && name !== product.name) {
      changes.name = { old: product.name, new: name };
      product.name = name;
    }

    if (description !== undefined && description !== product.description) {
      changes.description = { old: product.description, new: description };
      product.description = description;
    }

    if (price !== undefined && price !== product.price) {
      changes.price = { old: product.price, new: price };
      product.price = price;
    }

    const newCategories = Array.isArray(categories)
      ? categories
      : categories.split(",");
    if (
      categories &&
      JSON.stringify(newCategories) !== JSON.stringify(product.categories)
    ) {
      changes.categories = {
        old: product.categories,
        new: newCategories,
      };
      product.categories = newCategories;
    }

    // Siempre actualiza imágenes y variantes (sin auditar)
    product.images = finalImages;
    product.variants = validVariants;

    // === Guardar producto ===
    await product.save();

    // === Registrar auditoría si hubo cambios auditables ===
    if (Object.keys(changes).length > 0) {
      await ProductAudit.create({
        product: product._id,
        user: userId,
        action: "updated",
        changes,
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
    if (!deleted)
      return res.status(404).json({ error: "Producto no encontrado" });
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
