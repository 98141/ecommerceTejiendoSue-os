const mongoose = require("mongoose");
const Order = require("../models/Order");
const NodeCache = require("node-cache");

// TTL 60s; check cada 120s
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

/** Limpia todo el caché del dashboard (la exportamos para invocarla desde orderController) */
function clearDashboardCache() {
  try {
    cache.flushAll();
  } catch (_) {}
}
exports.clearDashboardCache = clearDashboardCache;

// ----------------- helpers -----------------
function parseBool(v, def = true) {
  if (v === undefined || v === null) return def;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}
function parseDateOrNull(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function daysBetween(a, b) {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}
function pctChange(curr, prev) {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / prev) * 100;
}

// Construye pipeline facet para un rango
function buildFacetPipeline({ from, to, categoryId, groupByMonth }) {
  const matchOrder = {};
  if (from || to) {
    matchOrder.createdAt = {};
    if (from) matchOrder.createdAt.$gte = startOfDay(from);
    if (to) matchOrder.createdAt.$lte = endOfDay(to);
  }

  const pipeline = [
    { $match: matchOrder },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productDoc",
      },
    },
    { $unwind: { path: "$productDoc", preserveNullAndEmptyArrays: true } },
  ];

  if (categoryId) {
    pipeline.push({ $match: { "productDoc.categories": categoryId } }); // tu modelo usa UNA categoría
  }

  const periodFormat = groupByMonth ? "%Y-%m" : "%Y-%m-%d";

  pipeline.push({
    $facet: {
      totals: [
        { $match: { status: { $ne: "cancelado" } } },
        {
          $group: {
            _id: null,
            totalSales: {
              $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] },
            },
            totalItemsSold: { $sum: "$items.quantity" },
            ordersSet: { $addToSet: "$_id" },
            usersSet: { $addToSet: "$user" },
          },
        },
        {
          $project: {
            _id: 0,
            totalSales: { $ifNull: ["$totalSales", 0] },
            totalItemsSold: { $ifNull: ["$totalItemsSold", 0] },
            totalOrders: { $size: "$ordersSet" },
            totalUsers: { $size: "$usersSet" },
          },
        },
      ],
      series: [
        { $match: { status: { $ne: "cancelado" } } },
        {
          $group: {
            _id: {
              period: {
                $dateToString: { format: periodFormat, date: "$createdAt" },
              },
            },
            total: {
              $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] },
            },
            orders: { $addToSet: "$_id" },
            items: { $sum: "$items.quantity" },
          },
        },
        {
          $project: {
            _id: 0,
            period: "$_id.period",
            total: 1,
            orders: { $size: "$orders" },
            items: 1,
          },
        },
        { $sort: { period: 1 } },
      ],
      ordersByStatus: [
        { $group: { _id: "$_id", status: { $first: "$status" } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
        { $sort: { status: 1 } },
      ],
      topProducts: [
        { $match: { status: { $ne: "cancelado" } } },
        {
          $group: {
            _id: { id: "$productDoc._id", name: "$productDoc.name" },
            quantity: { $sum: "$items.quantity" },
            revenue: {
              $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] },
            },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            productId: "$_id.id",
            name: "$_id.name",
            quantity: 1,
            revenue: 1,
          },
        },
      ],
    },
  });

  return pipeline;
}

async function runAgg({ from, to, category, groupByMonth }) {
  const categoryId =
    category && mongoose.Types.ObjectId.isValid(category)
      ? new mongoose.Types.ObjectId(category)
      : null;

  const pipeline = buildFacetPipeline({ from, to, categoryId, groupByMonth });
  const [agg] = await Order.aggregate(pipeline);

  const totals = (agg?.totals && agg.totals[0]) || {
    totalSales: 0,
    totalItemsSold: 0,
    totalOrders: 0,
    totalUsers: 0,
  };

  const aov =
    totals.totalOrders > 0 ? totals.totalSales / totals.totalOrders : 0;
  const itemsPerOrder =
    totals.totalOrders > 0 ? totals.totalItemsSold / totals.totalOrders : 0;

  return {
    totals: {
      totalSales: Number(totals.totalSales.toFixed(2)),
      totalItemsSold: totals.totalItemsSold,
      totalOrders: totals.totalOrders,
      totalUsers: totals.totalUsers,
      aov: Number(aov.toFixed(2)),
      itemsPerOrder: Number(itemsPerOrder.toFixed(2)),
    },
    series: agg?.series || [],
    ordersByStatus: agg?.ordersByStatus || [],
    topProducts: agg?.topProducts || [],
  };
}

/**
 * GET /api/dashboard/summary
 * Query: startDate, endDate, category, groupByMonth
 * Respuesta incluye comparativo del período anterior y series previas.
 */
exports.getSummary = async (req, res) => {
  try {
    const groupByMonth = parseBool(req.query.groupByMonth, true);
    let from = parseDateOrNull(req.query.startDate);
    let to = parseDateOrNull(req.query.endDate);

    // Si no envían rango, usa últimos 30 días como default
    if (!from && !to) {
      const today = new Date();
      to = today;
      const from30 = new Date(today);
      from30.setDate(from30.getDate() - 29);
      from = from30;
    }

    // Cache key por combinación de filtros
    const cacheKey = `summary|${from ? startOfDay(from).toISOString() : ""}|${
      to ? endOfDay(to).toISOString() : ""
    }|${req.query.category || ""}|${groupByMonth ? "M" : "D"}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    // Rango anterior: mismo tamaño pegado antes
    let prevFrom, prevTo;
    if (from && to) {
      const days = Math.max(0, daysBetween(from, to));
      prevTo = new Date(startOfDay(from).getTime() - 1); // justo antes del 'from'
      prevFrom = new Date(prevTo);
      prevFrom.setDate(prevFrom.getDate() - days);
    } else {
      // fallback si solo viene uno (raro): usar 30 días anteriores al 'from' o 'to'
      const end = to || new Date();
      prevTo = new Date(startOfDay(end).getTime() - 1);
      prevFrom = new Date(prevTo);
      prevFrom.setDate(prevFrom.getDate() - 29);
    }

    // Ejecuta actual y anterior
    const [curr, prev] = await Promise.all([
      runAgg({ from, to, category: req.query.category, groupByMonth }),
      runAgg({
        from: prevFrom,
        to: prevTo,
        category: req.query.category,
        groupByMonth,
      }),
    ]);

    // Porcentajes de cambio
    const change = {
      totalSalesPct: Number(
        pctChange(curr.totals.totalSales, prev.totals.totalSales).toFixed(2)
      ),
      totalOrdersPct: Number(
        pctChange(curr.totals.totalOrders, prev.totals.totalOrders).toFixed(2)
      ),
      totalItemsSoldPct: Number(
        pctChange(
          curr.totals.totalItemsSold,
          prev.totals.totalItemsSold
        ).toFixed(2)
      ),
      aovPct: Number(pctChange(curr.totals.aov, prev.totals.aov).toFixed(2)),
      itemsPerOrderPct: Number(
        pctChange(curr.totals.itemsPerOrder, prev.totals.itemsPerOrder).toFixed(
          2
        )
      ),
    };

    const payload = {
      // actuales
      totalSales: curr.totals.totalSales,
      totalOrders: curr.totals.totalOrders,
      totalItemsSold: curr.totals.totalItemsSold,
      totalUsers: curr.totals.totalUsers,
      aov: curr.totals.aov,
      itemsPerOrder: curr.totals.itemsPerOrder,
      monthlySales: curr.series, // [{period,total,orders,items}]
      ordersByStatus: curr.ordersByStatus,
      topProducts: curr.topProducts,

      // anteriores
      prev: {
        totalSales: prev.totals.totalSales,
        totalOrders: prev.totals.totalOrders,
        totalItemsSold: prev.totals.totalItemsSold,
        totalUsers: prev.totals.totalUsers,
        aov: prev.totals.aov,
        itemsPerOrder: prev.totals.itemsPerOrder,
        monthlySales: prev.series,
      },

      // cambios %
      change,

      // metadatos
      currency: "USD",
      range: {
        from: from ? startOfDay(from) : null,
        to: to ? endOfDay(to) : null,
        prevFrom,
        prevTo,
        groupByMonth,
      },
    };

    cache.set(cacheKey, payload);
    return res.json(payload);
  } catch (err) {
    console.error("Error getSummary:", err);
    return res.status(500).json({ error: "Error al obtener dashboard" });
  }
};
