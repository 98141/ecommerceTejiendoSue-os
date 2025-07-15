const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, categories } = req.body;
    const imagePaths = req.files.map(
      (file) => `/uploads/products/${file.filename}`
    );

    const newProduct = new Product({
      name,
      description,
      price,
      stock,
      categories: Array.isArray(categories)
        ? categories
        : categories.split(","),
      images: imagePaths,
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
      stock,
      categories,
      existingImages = [],
    } = req.body;

    const existingImagesArray = Array.isArray(existingImages)
      ? existingImages
      : [existingImages];

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ error: "Producto no encontrado" });

    // 🗑 Eliminar imágenes que ya no se desean
    const imagesToDelete = product.images.filter(
      (img) => !existingImagesArray.includes(img)
    );

    for (const imgPath of imagesToDelete) {
      const fullPath = path.join(__dirname, "..", imgPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    // 📥 Agregar nuevas imágenes
    const newImages = req.files.map(
      (file) => `/uploads/products/${file.filename}`
    );

    const finalImages = [...existingImagesArray, ...newImages];

    // 🔄 Actualizar producto
    product.name = name;
    product.description = description;
    product.price = price;
    product.stock = stock;
    product.categories = Array.isArray(categories)
      ? categories
      : categories.split(",");
    product.images = finalImages;

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
