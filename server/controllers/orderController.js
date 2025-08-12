// controllers/orderController.js
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

// Util: clave lógica para comparar items por variante
const itemKey = (i) =>
  `${String(i.product)}::${String(i.size || "")}::${String(i.color || "")}`;

// Calcula precio efectivo (usa método del modelo si existe)
function effectivePrice(product) {
  try {
    if (typeof product.getEffectivePrice === "function") {
      return Number(product.getEffectivePrice()) || Number(product.price) || 0;
    }
    return Number(product.price) || 0;
  } catch {
    return Number(product.price) || 0;
  }
}

// ========================== CREATE ==========================
/**
 * Crear pedido del usuario autenticado
 * - Valida items, stock y variantes
 * - Calcula unitPrice por ítem y total
 * - Descuenta stock de forma ATÓMICA (transacción)
 */
exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Debes incluir al menos un producto" });
    }

    // Normaliza y valida payload
    const normalizedItems = [];
    for (const item of items) {
      const productId = item.product;
      const sizeId = item.size;
      const colorId = item.color;
      const qty = Number(item.quantity) || 0;

      if (!productId || !sizeId || !colorId || qty <= 0) {
        return res
          .status(400)
          .json({ error: "Datos incompletos o inválidos en uno de los ítems" });
      }
      normalizedItems.push({
        product: productId,
        size: sizeId,
        color: colorId,
        quantity: qty,
      });
    }

    await session.withTransaction(async () => {
      let total = 0;
      const itemsToSave = [];

      for (const it of normalizedItems) {
        const product = await Product.findById(it.product).session(session);
        if (!product) {
          throw new Error(`Producto con ID ${it.product} no encontrado`);
        }

        // Busca variante exacta
        const variantIndex = product.variants.findIndex(
          (v) =>
            String(v.size) === String(it.size) &&
            String(v.color) === String(it.color)
        );
        if (variantIndex === -1) {
          throw new Error(
            `Variante no disponible para el producto: ${product.name}`
          );
        }

        // Stock suficiente
        const currentStock = Number(product.variants[variantIndex].stock) || 0;
        if (currentStock < it.quantity) {
          throw new Error(
            `Stock insuficiente para ${product.name}. Disponible: ${currentStock}, solicitado: ${it.quantity}`
          );
        }

        // Descuenta stock
        product.variants[variantIndex].stock = currentStock - it.quantity;
        await product.save({ session });

        // Precio efectivo en el momento
        const unitPrice = effectivePrice(product);

        total += unitPrice * it.quantity;
        itemsToSave.push({
          product: it.product,
          size: it.size,
          color: it.color,
          quantity: it.quantity,
          unitPrice,
        });
      }

      const order = await Order.create(
        [
          {
            user: req.user.id,
            items: itemsToSave,
            total,
            status: "pendiente",
          },
        ],
        { session }
      );

      // Devuelve orden creada (no poblada para rendimiento)
      res.status(201).json(order[0]);
    });
  } catch (err) {
    console.error("Error en createOrder:", err);
    // Si es throw dentro de la tx, llega acá
    res.status(400).json({ error: err.message || "Error al procesar pedido" });
  } finally {
    session.endSession();
  }
};

// ========================== READ (USUARIO) ==========================
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate({ path: "items.product", select: "name price" })
      .populate({ path: "items.size", select: "label" })
      .populate({ path: "items.color", select: "name" })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Error al obtener pedidos:", err);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
};

// ========================== READ (ADMIN) ==========================
exports.getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate("user", "name email")
      .populate({ path: "items.product", select: "name price" })
      .populate({ path: "items.size", select: "label" })
      .populate({ path: "items.color", select: "name" })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Error getAllOrders:", err);
    res.status(500).json({ error: err.message });
  }
};

// ========================== UPDATE STATUS (ADMIN) ==========================
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
    console.error("Error updateOrderStatus:", err);
    res.status(400).json({ error: err.message });
  }
};

// ========================== READ BY ID ==========================
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "email name")
      .populate({ path: "items.product", select: "name price" })
      .populate({ path: "items.size", select: "label" })
      .populate({ path: "items.color", select: "name" });

    if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
    res.json(order);
  } catch (err) {
    console.error("Error getOrderById:", err);
    res.status(500).json({ error: "Error al obtener el pedido" });
  }
};

// ========================== UPDATE (ADMIN) ==========================
/**
 * Permite editar ítems, tracking, transportadora, comentario y estado.
 * - Ajusta stock por diferencia de cantidades, de forma atómica.
 * - Si se agrega un ítem nuevo, toma unitPrice efectivo actual.
 * - Si el ítem ya tenía unitPrice, se preserva (histórico).
 */
exports.updateOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    const { status, items, trackingNumber, shippingCompany, adminComment } =
      req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Pedido no encontrado" });

    await session.withTransaction(async () => {
      // Clon previo para cálculos
      const prevItems = order.items.map((i) => ({
        product: String(i.product),
        size: String(i.size || ""),
        color: String(i.color || ""),
        quantity: Number(i.quantity) || 0,
        unitPrice: Number(i.unitPrice) || 0,
      }));
      const prevMap = new Map(prevItems.map((i) => [itemKey(i), i]));

      let nextItems = Array.isArray(items) ? items : null;

      if (nextItems) {
        // Normaliza y valida items entrantes
        const normalizedNext = [];
        for (const it of nextItems) {
          const productId = it.product;
          const sizeId = it.size;
          const colorId = it.color;
          const qty = Number(it.quantity) || 0;

          if (!productId || !sizeId || !colorId || qty <= 0) {
            throw new Error("Datos incompletos o inválidos en los ítems");
          }

          // Valida existencia del producto y variante
          const product = await Product.findById(productId).session(session);
          if (!product) throw new Error("Producto no encontrado");

          const vIndex = product.variants.findIndex(
            (v) =>
              String(v.size) === String(sizeId) &&
              String(v.color) === String(colorId)
          );
          if (vIndex === -1) {
            throw new Error(
              `Variante no disponible (producto: ${product.name})`
            );
          }

          // Determina diferencia de cantidad vs. anterior
          const key = `${String(productId)}::${String(sizeId)}::${String(
            colorId
          )}`;
          const prev = prevMap.get(key);
          const prevQty = prev ? prev.quantity : 0;
          const diff = qty - prevQty;

          // Si aumenta cantidad, verifica stock
          if (diff > 0) {
            const currentStock = Number(product.variants[vIndex].stock) || 0;
            if (currentStock < diff) {
              throw new Error(
                `Stock insuficiente para ${product.name}. Falta: ${
                  diff - currentStock
                }`
              );
            }
          }

          normalizedNext.push({
            productId,
            sizeId,
            colorId,
            qty,
            vIndex,
            product,
          });
        }

        // Aplica ajuste de stock por diferencia
        for (const n of normalizedNext) {
          const key = `${String(n.productId)}::${String(n.sizeId)}::${String(
            n.colorId
          )}`;
          const prev = prevMap.get(key);
          const prevQty = prev ? prev.quantity : 0;
          const diff = n.qty - prevQty;
          if (diff !== 0) {
            const currentStock =
              Number(n.product.variants[n.vIndex].stock) || 0;
            const nextStock = currentStock - diff; // si diff>0 disminuye; si diff<0 aumenta
            if (nextStock < 0) {
              throw new Error(`Stock insuficiente para ${n.product.name}`);
            }
            n.product.variants[n.vIndex].stock = nextStock;
            await n.product.save({ session });
          }
        }

        // Construye nuevos items preservando unitPrice previo si existe
        const rebuilt = [];
        for (const n of normalizedNext) {
          const key = `${String(n.productId)}::${String(n.sizeId)}::${String(
            n.colorId
          )}`;
          const prev = prevMap.get(key);
          const unitPrice = prev
            ? Number(prev.unitPrice) // preserva histórico
            : effectivePrice(n.product); // nuevo ítem: precio actual

          rebuilt.push({
            product: n.productId,
            size: n.sizeId,
            color: n.colorId,
            quantity: n.qty,
            unitPrice,
          });
        }

        order.items = rebuilt;
      }

      // Actualiza campos adicionales
      if (typeof status !== "undefined") order.status = status;
      if (typeof trackingNumber !== "undefined")
        order.trackingNumber = trackingNumber;
      if (typeof shippingCompany !== "undefined")
        order.shippingCompany = shippingCompany;
      if (typeof adminComment !== "undefined")
        order.adminComment = adminComment;

      // Recalcula total SIEMPRE desde items (seguro)
      let newTotal = 0;
      for (const it of order.items) {
        // Normaliza unitPrice si faltara en documentos viejos
        if (typeof it.unitPrice === "undefined" || it.unitPrice === null) {
          const prod = await Product.findById(it.product).session(session);
          it.unitPrice = effectivePrice(prod);
        }
        newTotal += Number(it.unitPrice) * Number(it.quantity);
      }
      order.total = Number(newTotal.toFixed(2));

      await order.save({ session });
      res.json({ message: "Pedido actualizado con control de stock", order });
    });
  } catch (error) {
    console.error("Error actualizando pedido:", error);
    res
      .status(400)
      .json({ error: error.message || "Error al actualizar pedido" });
  } finally {
    session.endSession();
  }
};

// ========================== CANCEL ==========================
exports.cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Pedido no encontrado" });

    if (order.status !== "pendiente") {
      return res
        .status(400)
        .json({ error: "Solo pedidos 'pendiente' pueden cancelarse" });
    }

    await session.withTransaction(async () => {
      // Restituye stock
      for (const item of order.items) {
        const product = await Product.findById(item.product).session(session);
        if (!product) continue;

        const vIndex = product.variants.findIndex(
          (v) =>
            String(v.size) === String(item.size) &&
            String(v.color) === String(item.color)
        );
        if (vIndex !== -1) {
          const current = Number(product.variants[vIndex].stock) || 0;
          product.variants[vIndex].stock = current + Number(item.quantity);
          await product.save({ session });
        }
      }

      order.status = "cancelado";
      await order.save({ session });
      res.json({ message: "Pedido cancelado y stock restablecido", order });
    });
  } catch (err) {
    console.error("Error al cancelar pedido:", err);
    res.status(500).json({ error: "Error al cancelar el pedido" });
  } finally {
    session.endSession();
  }
};

// ========================== UTILS ==========================
exports.getAllOrderIds = async (req, res) => {
  try {
    const orders = await Order.find({}, "_id").sort({ createdAt: -1 });
    res.json(orders.map((o) => o._id));
  } catch (err) {
    console.error("Error getAllOrderIds:", err);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
};
