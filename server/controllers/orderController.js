const Order = require("../models/Order");
const Product = require("../models/Product");

// Crear un pedido (usuario) con validacion
exports.createOrder = async (req, res) => {
  try {
    const { items, total } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Debes incluir al menos un producto" });
    }

    let calculatedTotal = 0;

    for (const item of items) {
      const { product: productId, size, color, quantity } = item;

      if (!productId || !size || !color || !quantity) {
        return res
          .status(400)
          .json({ error: "Datos incompletos en uno de los ítems del pedido" });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ error: `Producto con ID ${productId} no encontrado` });
      }

      // Buscar variante específica
      const variant = product.variants.find(
        (v) => v.size.toString() === size && v.color.toString() === color
      );

      if (!variant) {
        return res.status(400).json({
          error: `La combinación de talla y color no está disponible para el producto: ${product.name}`,
        });
      }

      if (variant.stock < quantity) {
        return res.status(400).json({
          error: `Stock insuficiente para la combinación seleccionada de ${product.name}. Disponible: ${variant.stock}`,
        });
      }

      calculatedTotal += product.price * quantity;
    }

    if (calculatedTotal !== total) {
      return res.status(400).json({
        error: `Total incorrecto. Total real: ${calculatedTotal}`,
      });
    }

    // 🧮 Descontar stock y registrar pedido
    for (const item of items) {
      const product = await Product.findById(item.product);

      const variantIndex = product.variants.findIndex(
        (v) =>
          v.size.toString() === item.size && v.color.toString() === item.color
      );

      if (variantIndex >= 0) {
        product.variants[variantIndex].stock -= item.quantity;
        await product.save();
      }
    }

    const order = await Order.create({
      user: req.user.id,
      items,
      total,
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("Error en orden:", err);
    res.status(500).json({ error: "Error al procesar pedido" });
  }
};

// Obtener pedidos del usuario autenticado
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate({
        path: "items.product",
        select: "name price",
      })
      .populate({
        path: "items.size",
        select: "label",
      })
      .populate({
        path: "items.color",
        select: "name",
      });

    res.json(orders);
  } catch (err) {
    console.error("Error al obtener pedidos:", err);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
};

// Obtener todos los pedidos (solo admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate("user")
      .populate("items.product")
      .populate({
        path: "items.size",
        select: "label",
      })
      .populate({
        path: "items.color",
        select: "name",
      })
      .sort({ createdAt: -1 }); // Ordenar por fecha reciente

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cambiar estado de un pedido (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "email name")
      .populate("items.product")
      .populate({
        path: "items.size",
        select: "label",
      })
      .populate({
        path: "items.color",
        select: "name",
      })
      .sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener el pedido" });
  }
};
