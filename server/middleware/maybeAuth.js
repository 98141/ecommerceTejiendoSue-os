const jwt = require("jsonwebtoken");

module.exports = function maybeAuth(req, _res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token) {
      const dec = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: dec.id, role: dec.role };
    }
  } catch { /* ignore invalid token */ }
  next();
};
