const Order = require('../models/Order')
const Product = require('../models/Product');

// Crear un pedido (usuario) con validacion 
exports.createOrder = async (req, res) => {
  try {
    const { items, total } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Debes incluir al menos un producto' });
    }

    let calculatedTotal = 0;

    // Verificar stock y calcular total real
    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({ error: `Producto con ID ${item.product} no encontrado` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Stock insuficiente para el producto: ${product.name}. Disponible: ${product.stock}`
        });
      }

      calculatedTotal += product.price * item.quantity;
    }

    // Verificar si el total enviado coincide con el calculado
    if (calculatedTotal !== total) {
      return res.status(400).json({
        error: `Total incorrecto. Total real: ${calculatedTotal}`
      });
    }

    // Crear pedido
    const order = await Order.create({
      user: req.user.id,
      items,
      total
    });

    // Descontar stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener pedidos del usuario autenticado
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate('items.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener todos los pedidos (solo admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user').populate('items.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cambiar estado de un pedido (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
