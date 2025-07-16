const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");

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
    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Error al crear producto:", err);
    res.status(500).json({ error: "Error al crear producto" });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("categories", "name");
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

    // Manejo de imágenes
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

    // Parsear variantes
    let parsedVariants = [];
    if (rawVariants) {
      parsedVariants = JSON.parse(rawVariants);
    }

    const validVariants = parsedVariants.filter(
      (v) => v.size && v.color && Number(v.stock) >= 0
    );

    // Actualizar campos
    product.name = name;
    product.description = description;
    product.price = price;
    product.categories = Array.isArray(categories)
      ? categories
      : categories.split(",");
    product.images = finalImages;
    product.variants = validVariants;

    await product.save();

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
