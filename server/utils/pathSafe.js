const path = require("path");

/**
 * Normaliza y asegura rutas relativas a /uploads/products
 * Evita traversal y variantes raras de slash.
 */
function normalizeProductImagePath(p) {
  if (!p) return "";
  // Debe empezar con /uploads/products
  const safeBase = "/uploads/products/";
  let rel = String(p).replace(/\\/g, "/");
  if (!rel.startsWith(safeBase)) {
    // fuerza a carpeta segura
    const onlyFile = path.posix.basename(rel);
    rel = safeBase + onlyFile;
  }
  // Normaliza ./.. etc
  const normalized = path.posix.normalize(rel);
  if (!normalized.startsWith(safeBase)) {
    // fallback final por seguridad
    return safeBase + path.posix.basename(normalized);
  }
  return normalized;
}

module.exports = { normalizeProductImagePath };
