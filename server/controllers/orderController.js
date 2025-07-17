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
      .sort({ createdAt: -1 });
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

exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const { status, items, trackingNumber, shippingCompany, adminComment } =
    req.body;

  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Pedido no encontrado" });

    // 1. Validar y preparar nuevos ítems
    if (Array.isArray(items)) {
      const updatedItems = [];

      for (let item of items) {
        if (!item.product || !item.quantity) {
          return res
            .status(400)
            .json({ error: "Datos incompletos en los ítems" });
        }

        const productData = await Product.findById(item.product);
        if (!productData) {
          return res.status(404).json({ error: "Producto no encontrado" });
        }

        const variant = productData.variants.find(
          (v) =>
            v.size.toString() === item.size && v.color.toString() === item.color
        );

        if (!variant) {
          return res.status(400).json({
            error: `Variante no disponible (producto: ${productData.name})`,
          });
        }

        // Buscar ítem anterior
        const existingItem = order.items.find(
          (i) =>
            i.product.toString() === item.product &&
            i.size?.toString() === item.size &&
            i.color?.toString() === item.color
        );

        const prevQty = existingItem ? existingItem.quantity : 0;
        const qtyDiff = item.quantity - prevQty;

        if (qtyDiff > 0 && qtyDiff > variant.stock) {
          return res.status(400).json({
            error: `Stock insuficiente para ${productData.name} (Talla: ${item.size}, Color: ${item.color})`,
          });
        }

        updatedItems.push({
          product: item.product,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        });
      }

      // 2. Ajustar stock (tanto aumento como disminución)
      for (let item of updatedItems) {
        const product = await Product.findById(item.product);
        const variantIndex = product.variants.findIndex(
          (v) =>
            v.size.toString() === item.size && v.color.toString() === item.color
        );

        const existingItem = order.items.find(
          (i) =>
            i.product.toString() === item.product &&
            i.size?.toString() === item.size &&
            i.color?.toString() === item.color
        );

        const prevQty = existingItem ? existingItem.quantity : 0;
        const qtyDiff = item.quantity - prevQty;

        if (qtyDiff !== 0) {
          product.variants[variantIndex].stock -= qtyDiff;

          if (product.variants[variantIndex].stock < 0) {
            return res.status(400).json({
              error: `Stock insuficiente para ${product.name} (Talla: ${item.size}, Color: ${item.color})`,
            });
          }

          await product.save();
        }
      }
      order.items = updatedItems;
    }

    // 3. Actualizar campos adicionales
    if (status) order.status = status;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (shippingCompany !== undefined) order.shippingCompany = shippingCompany;
    if (adminComment !== undefined) order.adminComment = adminComment;

    // 4. Recalcular total
    let total = 0;
    for (let item of order.items) {
      const populated = await Product.findById(item.product);
      if (!populated) throw new Error("Producto no encontrado");
      total += populated.price * item.quantity;
    }
    order.total = total;

    await order.save();
    res.json({ message: "Pedido actualizado con control de stock", order });
  } catch (error) {
    console.error("Error actualizando pedido:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");

    if (!order) return res.status(404).json({ error: "Pedido no encontrado" });

    if (order.status !== "pendiente") {
      return res.status(400).json({
        error: "Solo los pedidos con estado 'pendiente' pueden ser cancelados",
      });
    }

    // 🔄 Reestablecer stock para cada producto y variante
    for (const item of order.items) {
      const product = await Product.findById(item.product._id);
      if (!product) continue;

      const variantIndex = product.variants.findIndex(
        (v) =>
          v.size.toString() === item.size.toString() &&
          v.color.toString() === item.color.toString()
      );

      if (variantIndex !== -1) {
        product.variants[variantIndex].stock += item.quantity;
        await product.save();
      }
    }

    // 🚫 Cancelar el pedido
    order.status = "cancelado";
    await order.save();

    res.json({ message: "Pedido cancelado y stock restablecido", order });
  } catch (err) {
    console.error("Error al cancelar pedido:", err.message);
    res.status(500).json({ error: "Error al cancelar el pedido" });
  }
};

exports.getAllOrderIds = async (req, res) => {
  try {
    const orders = await Order.find({}, "_id").sort({ createdAt: -1 });
    res.json(orders.map((o) => o._id)); // Devuelve un array de IDs
  } catch (err) {
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
};