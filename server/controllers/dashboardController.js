const mongoose = require("mongoose");
const Order = require("../models/Order");

// Parse helpers
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

/**
 * GET /api/dashboard/summary
 * Query:
 *  - startDate, endDate (YYYY-MM-DD)
 *  - category (ObjectId opcional)
 *  - groupByMonth (true|false)
 *
 * Respuesta:
 *  {
 *    totalSales, totalOrders, totalItemsSold, totalUsers, aov, itemsPerOrder,
 *    monthlySales: [{ period, total, orders, items }],
 *    ordersByStatus: [{ status, count }],
 *    topProducts: [{ productId, name, quantity, revenue }]
 *  }
 */
exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const groupByMonth = parseBool(req.query.groupByMonth, true);

    const from = parseDateOrNull(startDate);
    const to = parseDateOrNull(endDate);
    const matchOrder = {};
    if (from || to) {
      matchOrder.createdAt = {};
      if (from) matchOrder.createdAt.$gte = from;
      if (to) {
        // incluir todo el día fin
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        matchOrder.createdAt.$lte = end;
      }
    }

    const categoryFilter =
      category && mongoose.Types.ObjectId.isValid(category)
        ? new mongoose.Types.ObjectId(category)
        : null;

    // Base pipeline: órdenes en rango -> items -> join product (para filtrar categoría)
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

    if (categoryFilter) {
      pipeline.push({ $match: { "productDoc.categories": categoryFilter } });
    }

    // Agrupación (ventas ignoran cancelados; pedidos totales y por estado no)
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

        monthlySales: [
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
          {
            $group: {
              _id: "$_id",
              status: { $first: "$status" },
            },
          },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              status: "$_id",
              count: 1,
            },
          },
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

    const [resAgg] = await Order.aggregate(pipeline);
    const totals = (resAgg?.totals && resAgg.totals[0]) || {
      totalSales: 0,
      totalItemsSold: 0,
      totalOrders: 0,
      totalUsers: 0,
    };

    // KPIs derivados
    const aov =
      totals.totalOrders > 0 ? totals.totalSales / totals.totalOrders : 0;
    const itemsPerOrder =
      totals.totalOrders > 0 ? totals.totalItemsSold / totals.totalOrders : 0;

    return res.json({
      totalSales: Number(totals.totalSales.toFixed(2)),
      totalOrders: totals.totalOrders,
      totalItemsSold: totals.totalItemsSold,
      totalUsers: totals.totalUsers,
      aov: Number(aov.toFixed(2)),
      itemsPerOrder: Number(itemsPerOrder.toFixed(2)),
      monthlySales: resAgg?.monthlySales || [],
      ordersByStatus: resAgg?.ordersByStatus || [],
      topProducts: resAgg?.topProducts || [],
      // tip: podrías devolver también currency y timezone si quieres formatear en front
      currency: "USD",
    });
  } catch (err) {
    console.error("Error getSummary:", err);
    return res.status(500).json({ error: "Error al obtener dashboard" });
  }
};
