const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpe?g|png|webp|gif)$/i.test(file.mimetype);
    cb(ok ? null : new Error("Tipo de archivo no permitido"), ok);
  },
});

function ensureDir() {
  const dir = path.join(__dirname, "..", "uploads", "avatars");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function processAvatar(req, _res, next) {
  try {
    if (!req.file) return next();
    const dir = ensureDir();
    const stamp = Date.now();
    const base = `av_${req.user?.id || "u"}_${stamp}`;
    const fullName = `${base}.webp`;
    const thumbName = `${base}_thumb.webp`;
    const fullPath = path.join(dir, fullName);
    const thumbPath = path.join(dir, thumbName);

    await sharp(req.file.buffer).rotate().resize({ width: 600 }).webp({ quality: 85 }).toFile(fullPath);
    await sharp(req.file.buffer).rotate().resize({ width: 160 }).webp({ quality: 80 }).toFile(thumbPath);

    req.avatarProcessed = {
      full: `/uploads/avatars/${fullName}`,
      thumb: `/uploads/avatars/${thumbName}`,
    };
    next();
  } catch (e) {
    next(e);
  }
}

module.exports = { uploadAvatar: upload.single("avatar"), processAvatar };
