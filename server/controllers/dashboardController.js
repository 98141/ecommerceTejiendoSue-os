const Order = require("../models/Order");
const Product = require("../models/Product");
const mongoose = require("mongoose");

exports.getDashboardSummary = async (req, res) => {
  try {
    const { startDate, endDate, category, groupByMonth } = req.query;
    const filters = {};

    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    if (category) {
      filters["items.category"] = new mongoose.Types.ObjectId(category);
    }

    const matchStage = { $match: filters };

    // Total ventas, pedidos y productos vendidos
    const totalStats = await Order.aggregate([
      matchStage,
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          totalItemsSold: { $sum: { $sum: "$items.quantity" } },
        },
      },
    ]);

    const summary = totalStats[0] || {
      totalSales: 0,
      totalOrders: 0,
      totalItemsSold: 0,
    };

    summary.totalUsers = await mongoose.model("User").countDocuments();

    // Ventas por mes
    const monthlySales = await Order.aggregate([
      matchStage,
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: "$total" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          month: {
            $concat: [
              { $toString: "$_id.month" },
              "-",
              { $toString: "$_id.year" },
            ],
          },
          total: 1,
        },
      },
    ]);

    // Pedidos por estado
    const ordersByStatus = await Order.aggregate([
      matchStage,
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } },
    ]);

    // Productos más vendidos
    const topProducts = await Order.aggregate([
      matchStage,
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          quantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $project: { name: "$product.name", quantity: 1 } },
    ]);

    res.json({
      ...summary,
      monthlySales,
      ordersByStatus,
      topProducts,
    });
  } catch (err) {
    console.error("Error en resumen del dashboard:", err);
    res.status(500).json({ error: "Error al generar estadísticas" });
  }
};

