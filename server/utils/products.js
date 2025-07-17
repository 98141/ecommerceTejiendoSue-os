const fs = require("fs");
const path = require("path");

// Esta función NO tiene nada que ver con mongoose ni schemas
// simplemente se encarga de asegurarse de que la carpeta de uploads exista
const ensureUploadsFolderExists = () => {
  const baseDir = path.join(__dirname, "..", "uploads", "products");
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    console.log("📂 Carpeta de uploads creada en:", baseDir);
  }
};

module.exports = ensureUploadsFolderExists;