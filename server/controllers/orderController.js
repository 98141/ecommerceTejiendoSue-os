const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

// Clave lógica de ítem (para comparar por variante)
const itemKey = (i) =>
  `${String(i.product)}::${String(i.size || "")}::${String(i.color || "")}`;

// Precio efectivo del producto (usa método del modelo si existe)
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

/** ========================== CREATE ========================== */
exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Debes incluir al menos un producto" });
    }

    // Normaliza payload
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
        if (!product)
          throw new Error(`Producto con ID ${it.product} no encontrado`);

        // Variante exacta
        const vIndex = product.variants.findIndex(
          (v) =>
            String(v.size) === String(it.size) &&
            String(v.color) === String(it.color)
        );
        if (vIndex === -1)
          throw new Error(
            `Variante no disponible para el producto: ${product.name}`
          );

        // Stock
        const stockBefore = Number(product.variants[vIndex].stock) || 0;
        if (stockBefore < it.quantity) {
          throw new Error(
            `Stock insuficiente para ${product.name}. Disponible: ${stockBefore}`
          );
        }

        const stockAfter = stockBefore - it.quantity;
        product.variants[vIndex].stock = stockAfter;
        await product.save({ session });

        // Precio efectivo (snapshot)
        const unitPrice = effectivePrice(product);

        total += unitPrice * it.quantity;
        itemsToSave.push({
          product: it.product,
          size: it.size,
          color: it.color,
          quantity: it.quantity,
          unitPrice,
          stockBeforePurchase: stockBefore,
          stockAtPurchase: stockAfter, // snapshot fijo
        });
      }

      const [order] = await Order.create(
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

      res.status(201).json(order);
    });
  } catch (err) {
    console.error("Error en createOrder:", err);
    res.status(400).json({ error: err.message || "Error al procesar pedido" });
  } finally {
    session.endSession();
  }
};

/** ========================== READ (USUARIO) ========================== */
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

/** ========================== READ (ADMIN) ========================== */
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

/** ========================== UPDATE STATUS (ADMIN) ========================== */
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

/** ========================== READ BY ID ========================== */
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

/** ========================== UPDATE (ADMIN) ========================== */
/**
 * Edita ítems y metadatos.
 * - Ajusta stock por diferencia (transacción).
 * - Ítem nuevo: unitPrice actual + crea snapshots.
 * - Ítem existente: preserva unitPrice y snapshots.
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
      const prevItems = order.items.map((i) => ({
        product: String(i.product),
        size: String(i.size || ""),
        color: String(i.color || ""),
        quantity: Number(i.quantity) || 0,
        unitPrice: Number(i.unitPrice) || 0,
        stockBeforePurchase:
          typeof i.stockBeforePurchase === "number"
            ? i.stockBeforePurchase
            : null,
        stockAtPurchase:
          typeof i.stockAtPurchase === "number" ? i.stockAtPurchase : null,
      }));
      const prevMap = new Map(prevItems.map((i) => [itemKey(i), i]));

      let nextItems = Array.isArray(items) ? items : null;
      const normalizedNext = [];

      if (nextItems) {
        // Normaliza, valida y prepara ajuste
        for (const it of nextItems) {
          const productId = it.product;
          const sizeId = it.size;
          const colorId = it.color;
          const qty = Number(it.quantity) || 0;

          if (!productId || !sizeId || !colorId || qty <= 0) {
            throw new Error("Datos incompletos o inválidos en los ítems");
          }

          const product = await Product.findById(productId).session(session);
          if (!product) throw new Error("Producto no encontrado");

          const vIndex = product.variants.findIndex(
            (v) =>
              String(v.size) === String(sizeId) &&
              String(v.color) === String(colorId)
          );
          if (vIndex === -1)
            throw new Error(
              `Variante no disponible (producto: ${product.name})`
            );

          const key = `${String(productId)}::${String(sizeId)}::${String(
            colorId
          )}`;
          const prev = prevMap.get(key);
          const prevQty = prev ? prev.quantity : 0;
          const diff = qty - prevQty;

          const currentStock = Number(product.variants[vIndex].stock) || 0;
          if (diff > 0 && currentStock < diff) {
            throw new Error(
              `Stock insuficiente para ${product.name}. Falta: ${
                diff - currentStock
              }`
            );
          }

          // Snapshots sólo si es ítem nuevo o faltaban
          let stockBeforePurchase = prev?.stockBeforePurchase ?? null;
          let stockAtPurchase = prev?.stockAtPurchase ?? null;

          if (!prev) {
            // Ítem nuevo → snapshot en este update
            const stockBefore = currentStock;
            const stockAfter = currentStock - diff; // diff > 0
            stockBeforePurchase = stockBefore;
            stockAtPurchase = stockAfter;
          } else if (prev && typeof stockAtPurchase !== "number") {
            // Documento antiguo sin snapshot → completa ahora
            const stockBefore = currentStock;
            const stockAfter = currentStock - diff;
            stockBeforePurchase = stockBefore;
            stockAtPurchase = stockAfter;
          }

          normalizedNext.push({
            productId,
            sizeId,
            colorId,
            qty,
            vIndex,
            product,
            prev,
            diff,
            currentStock,
            computedSnapshots: { stockBeforePurchase, stockAtPurchase },
          });
        }

        // Aplica ajuste de stock
        for (const n of normalizedNext) {
          if (n.diff !== 0) {
            const nextStock = n.currentStock - n.diff; // si diff>0 disminuye; si diff<0 aumenta
            if (nextStock < 0)
              throw new Error(`Stock insuficiente para ${n.product.name}`);
            n.product.variants[n.vIndex].stock = nextStock;
            await n.product.save({ session });
          }
        }

        // Reconstruye items preservando unitPrice/snapshots previos
        const rebuilt = [];
        for (const n of normalizedNext) {
          const key = `${String(n.productId)}::${String(n.sizeId)}::${String(
            n.colorId
          )}`;
          const prev = prevMap.get(key);

          const unitPrice = prev
            ? Number(prev.unitPrice)
            : effectivePrice(n.product);
          const stockBeforePurchase =
            prev && typeof prev.stockBeforePurchase === "number"
              ? prev.stockBeforePurchase
              : n.computedSnapshots.stockBeforePurchase;

          const stockAtPurchase =
            prev && typeof prev.stockAtPurchase === "number"
              ? prev.stockAtPurchase
              : n.computedSnapshots.stockAtPurchase;

          rebuilt.push({
            product: n.productId,
            size: n.sizeId,
            color: n.colorId,
            quantity: n.qty,
            unitPrice,
            stockBeforePurchase,
            stockAtPurchase,
          });
        }

        order.items = rebuilt;
      }

      // Campos adicionales
      if (typeof status !== "undefined") order.status = status;
      if (typeof trackingNumber !== "undefined")
        order.trackingNumber = trackingNumber;
      if (typeof shippingCompany !== "undefined")
        order.shippingCompany = shippingCompany;
      if (typeof adminComment !== "undefined")
        order.adminComment = adminComment;

      // Recalcula total
      let newTotal = 0;
      for (const it of order.items) {
        if (typeof it.unitPrice !== "number") {
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

/** ========================== CANCEL ========================== */
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

/** ========================== UTILS ========================== */
exports.getAllOrderIds = async (req, res) => {
  try {
    const orders = await Order.find({}, "_id").sort({ createdAt: -1 });
    res.json(orders.map((o) => o._id));
  } catch (err) {
    console.error("Error getAllOrderIds:", err);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
};

/** ========================== GLOBAL SALES HISTORY ========================== */
/**
 * GET /api/orders/sales-history
 * Filtros: from, to (YYYY-MM-DD), status, productId, userId, sizeId, colorId, limit
 * Responde items aplanados con: fecha, usuario, producto, variante, unitPrice, quantity, total,
 * stockAtPurchase, status, orderId
 */
exports.getGlobalSalesHistory = async (req, res) => {
  try {
    const {
      from,
      to,
      status,
      productId,
      userId,
      sizeId,
      colorId,
      limit = 1000,
    } = req.query;

    const match = {};
    if (status) match.status = status;

    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      match.user = new mongoose.Types.ObjectId(userId);
    }

    const pipeline = [{ $match: match }, { $unwind: "$items" }];

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      pipeline.push({
        $match: { "items.product": new mongoose.Types.ObjectId(productId) },
      });
    }
    if (sizeId && mongoose.Types.ObjectId.isValid(sizeId)) {
      pipeline.push({
        $match: { "items.size": new mongoose.Types.ObjectId(sizeId) },
      });
    }
    if (colorId && mongoose.Types.ObjectId.isValid(colorId)) {
      pipeline.push({
        $match: { "items.color": new mongoose.Types.ObjectId(colorId) },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDoc",
        },
      },
      { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDoc",
        },
      },
      { $unwind: { path: "$productDoc", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "sizes",
          localField: "items.size",
          foreignField: "_id",
          as: "sizeDoc",
        },
      },
      { $unwind: { path: "$sizeDoc", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "colors",
          localField: "items.color",
          foreignField: "_id",
          as: "colorDoc",
        },
      },
      { $unwind: { path: "$colorDoc", preserveNullAndEmptyArrays: true } },

      {
        $addFields: {
          unitPrice: { $toDouble: { $ifNull: ["$items.unitPrice", 0] } },
          quantity: { $toInt: { $ifNull: ["$items.quantity", 0] } },
          stockAtPurchase: { $ifNull: ["$items.stockAtPurchase", null] },
        },
      },
      { $addFields: { total: { $multiply: ["$unitPrice", "$quantity"] } } },

      {
        $project: {
          _id: 0,
          orderId: "$_id",
          date: "$createdAt",
          status: 1,
          userId: "$user",
          userName: { $ifNull: ["$userDoc.name", "Desconocido"] },

          productId: "$items.product",
          productName: { $ifNull: ["$productDoc.name", "Producto eliminado"] },

          sizeId: "$items.size",
          sizeLabel: { $ifNull: ["$sizeDoc.label", "Desconocido"] },

          colorId: "$items.color",
          colorName: { $ifNull: ["$colorDoc.name", "Desconocido"] },

          unitPrice: 1,
          quantity: 1,
          total: 1,
          stockAtPurchase: 1,
        },
      },
      { $sort: { date: -1 } },
      { $limit: Math.min(Number(limit) || 1000, 5000) }
    );

    const rows = await Order.aggregate(pipeline);
    return res.json(rows || []);
  } catch (err) {
    console.error("Error getGlobalSalesHistory:", err);
    return res
      .status(500)
      .json({ error: "Error al obtener historial general de ventas" });
  }
};
