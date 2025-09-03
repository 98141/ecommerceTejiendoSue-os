const User = require("../models/User");

exports.listUsers = async (req, res) => {
  const {
    q = "",
    role,
    verified,
    page = 1,
    limit = 20,
    sort = "createdAt:desc",
  } = req.query;

  const query = {};
  const text = String(q || "").trim();
  if (text) {
    query.$or = [
      { name: { $regex: text, $options: "i" } },
      { email: { $regex: text, $options: "i" } },
    ];
  }
  if (role && ["user", "admin"].includes(role)) {
    query.role = role;
  }
  if (verified === "1" || verified === "0") {
    query.isVerified = verified === "1";
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [sf, sd] = String(sort).split(":");
  const sortField =
    { createdAt: "createdAt", name: "name", email: "email" }[sf] || "createdAt";
  const sortDir = sd === "asc" ? 1 : -1;

  // Campos no sensibles
  const projection = "name email role isVerified createdAt";

  const [docs, total] = await Promise.all([
    User.find(query)
      .select(projection)
      .sort({ [sortField]: sortDir })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query),
  ]);

  // Fallback si no tienes timestamps en el schema:
  const withDates = docs.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    isVerified: !!u.isVerified,
    createdAt:
      u.createdAt ||
      new Date(parseInt(String(u._id).substring(0, 8), 16) * 1000),
  }));

  res.json({
    items: withDates,
    page: pageNum,
    limit: limitNum,
    total,
    hasMore: pageNum * limitNum < total,
  });
};
