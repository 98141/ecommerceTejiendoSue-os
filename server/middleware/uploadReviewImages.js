const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024, files: 4 }, // 3MB c/u, máx 4 imágenes
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpe?g|png|webp|gif)$/i.test(file.mimetype);
    cb(ok ? null : new Error("Tipo de archivo no permitido"), ok);
  },
});

function ensureReviewDir() {
  const dir = path.join(__dirname, "..", "uploads", "reviews");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function processReviewImages(req, _res, next) {
  try {
    if (!req.files || !req.files.length) return next();
    const dir = ensureReviewDir();
    const out = [];
    const stamp = Date.now();

    await Promise.all(
      req.files.map(async (file, idx) => {
        const base = `rev_${req.user?.id || "anon"}_${stamp}_${idx}`;
        const fullName = `${base}.webp`;
        const thumbName = `${base}_thumb.webp`;
        const fullPath = path.join(dir, fullName);
        const thumbPath = path.join(dir, thumbName);

        await sharp(file.buffer)
          .rotate()
          .resize({ width: 1600, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(fullPath);

        await sharp(file.buffer)
          .rotate()
          .resize({ width: 400, withoutEnlargement: true })
          .webp({ quality: 78 })
          .toFile(thumbPath);

        out.push({
          full: `/uploads/reviews/${fullName}`,
          thumb: `/uploads/reviews/${thumbName}`,
        });
      })
    );

    req.processedImages = out;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadReviewImages: upload.array("images", 4),
  processReviewImages,
};
