require("dotenv").config();

const path = require("path");
const fs = require("fs");
const http = require("http");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { Server } = require("socket.io");
const { randomUUID } = require("crypto");
const hpp = require("hpp");
const slowDown = require("express-slow-down");
const { errors: celebrateErrors } = require("celebrate");
const jwt = require("jsonwebtoken");

/* ======================= Entorno / Config ======================= */
const {
  NODE_ENV = "development",
  PORT = 5000,
  FRONTEND_ORIGIN: RAW_ORIGIN,
  CLIENT_URL,
  JSON_LIMIT = "1mb",
  MONGO_URI = "mongodb://localhost:27017/pajatoquilla",
  JWT_SECRET = "changeme",
} = process.env;

const FRONTEND_ORIGIN = (
  RAW_ORIGIN ||
  CLIENT_URL ||
  "http://localhost:5173"
).replace(/\/+$/, "");
const isProd = NODE_ENV === "production";

/* ======================= App + Server base ====================== */
const app = express();
const server = http.createServer(app);

// Menos info expuesta
app.disable("x-powered-by");
// Detrás de proxy (Nginx/Cloudflare) para cookies Secure / req.ip real
app.set("trust proxy", 1);

/* ======================= Seguridad / Cabeceras ================== */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer" },
    frameguard: { action: "deny" },
    noSniff: true,
    hsts: isProd
      ? { maxAge: 15552000, includeSubDomains: true, preload: false }
      : false,
    contentSecurityPolicy: isProd
      ? {
          useDefaults: true,
          directives: {
            "default-src": ["'self'"],
            "img-src": ["'self'", "data:", "blob:", FRONTEND_ORIGIN],
            "connect-src": ["'self'", FRONTEND_ORIGIN, "ws:", "wss:"],
            "script-src": ["'self'"],
            "style-src": ["'self'", "'unsafe-inline'"], 
            "font-src": ["'self'", "data:"],
            "object-src": ["'none'"],
            "frame-ancestors": ["'none'"],
            "upgrade-insecure-requests": [],
          },
        }
      : false,
  })
);
app.use(compression());

/* ============================ Request ID ======================== */
app.use((req, res, next) => {
  const incoming = req.get("X-Req-Id");
  const reqId = incoming && incoming.trim() ? incoming : randomUUID();
  req.id = reqId;
  res.setHeader("X-Req-Id", reqId);
  next();
});

/* ============================ Logging =========================== */
// En dev: verbose en consola. En prod: formato combined a archivo y solo ≥400.
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
app.use(
  morgan(isProd ? "combined" : "dev", {
    stream: isProd ? accessLogStream : process.stdout,
    skip: (req, res) => isProd && res.statusCode < 400,
  })
);

/* ============================ CORS ============================== */
const allowlist = [
  FRONTEND_ORIGIN,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl/healthchecks
    return cb(null, allowlist.includes(origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Req-Id",
  ],
  exposedHeaders: ["X-Req-Id"],
  maxAge: 86400,
};
app.use(cors(corsOptions));

/* ====================== Body / Cookies ========================== */
app.use(express.json({ limit: JSON_LIMIT, strict: true }));
app.use(cookieParser());

/* ==================== HPP (Parameter Pollution) ================= */
app.use(
  hpp({
    // Permite arrays en estas keys (no aplastar el query)
    whitelist: ["ids", "tags", "sizes", "colors", "categories"],
  })
);

/* =============== Sanitización in-place (NoSQL & proto) ========= */
function sanitizeInPlace(obj) {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      delete obj[key];
      continue;
    }
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
      continue;
    }
    const val = obj[key];
    if (val && typeof val === "object") sanitizeInPlace(val);
  }
}
app.use((req, _res, next) => {
  try {
    sanitizeInPlace(req.body);
    sanitizeInPlace(req.params);
    sanitizeInPlace(req.query);
    next();
  } catch (e) {
    next(e);
  }
});

/* ===================== Socket.IO (mismo origin) ================ */
const io = new Server(server, {
  cors: { origin: allowlist, methods: ["GET", "POST"], credentials: true },
});
app.set("io", io);

// Auth por JWT en handshake + rate limit de eventos
io.use((socket, next) => {
  try {
    const hdr = socket.handshake.headers?.authorization || "";
    const token =
      socket.handshake.auth?.token || hdr.replace(/^Bearer\s+/i, "");
    if (!token) return next(new Error("unauthorized"));
    const payload = jwt.verify(token, JWT_SECRET);
    socket.data.user = {
      id: payload?.id || payload?._id || payload?.sub || "unknown",
      role: payload?.role || "user",
      email: payload?.email || "",
    };
    return next();
  } catch (e) {
    return next(new Error("unauthorized"));
  }
});

// Token bucket muy simple en memoria por socket
const buckets = new Map(); // socket.id -> { ts, count }
function allowed(socket, limit = 15, windowMs = 5000) {
  const now = Date.now();
  const b = buckets.get(socket.id) || { ts: now, count: 0 };
  if (now - b.ts > windowMs) {
    b.ts = now;
    b.count = 0;
  }
  b.count++;
  buckets.set(socket.id, b);
  return b.count <= limit;
}

io.on("connection", (socket) => {
  socket.on("sendMessage", (message) => {
    if (!allowed(socket)) return; // silencia exceso
    const text = String(message?.text || "").slice(0, 2000);
    const safe = {
      text,
      from: socket.data.user?.id,
      role: socket.data.user?.role,
      at: Date.now(),
    };
    io.emit("newMessage", safe);
  });
});

/* ============================ Timeouts ========================== */
server.headersTimeout = 65_000;
server.requestTimeout = 30_000;
server.keepAliveTimeout = 60_000;
app.use((req, res, next) => {
  req.setTimeout(15_000);
  res.setTimeout(20_000);
  next();
});

/* ===================== Archivos estáticos ======================= */
function ensureUploadsFolderExists() {
  try {
    const uploadsRoot = path.join(__dirname, "uploads");
    const productsDir = path.join(uploadsRoot, "products");
    if (!fs.existsSync(uploadsRoot))
      fs.mkdirSync(uploadsRoot, { recursive: true });
    if (!fs.existsSync(productsDir))
      fs.mkdirSync(productsDir, { recursive: true });
    const keep = path.join(productsDir, ".gitkeep");
    if (!fs.existsSync(keep)) fs.writeFileSync(keep, "");
    console.log("📁 Directorios de uploads OK:", productsDir);
  } catch (err) {
    console.error("❌ No se pudo asegurar uploads:", err);
  }
}
ensureUploadsFolderExists();

app.use(
  "/uploads/products",
  express.static(path.join(__dirname, "uploads/products"), {
    etag: true,
    lastModified: true,
    maxAge: isProd ? "7d" : 0,
    immutable: isProd,
  })
);

/* ===================== API cache policy (no-store) ============== */
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

/* ========================= Rate Limiting ======================== */
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/users", authLimiter);

// Slowdown progresivo (anti bruteforce)
const authSlowdown = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 10,
  delayMs: (used, req) => {
    const delayAfter = req.slowDown.limit;
    return (used - delayAfter) * 250;
  },
  maxDelayMs: 2000,
});
app.use("/api/users", authSlowdown);

// Límites suaves para otras rutas de escritura
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(["/api/orders", "/api/messages", "/api/cart"], writeLimiter);

/* ============================== Rutas =========================== */
const userRoutes = require("./routes/userRoutes");
const productEntryHistoryRoutes = require("./routes/productEntryHistoryRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const messageRoutes = require("./routes/messageRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const sizeRoutes = require("./routes/sizeRoutes");
const colorRoutes = require("./routes/colorRoutes");
const visitRoutes = require("./routes/visitRouter");
const dashboardRoutes = require("./routes/dashboardRoutes");
const cartRoutes = require("./routes/cartRoutes");

// Healthcheck
app.get("/health", (_req, res) =>
  res.status(200).json({ ok: true, ts: Date.now() })
);

// API
app.use("/api/users", userRoutes);
app.use("/api/productsHistory", productEntryHistoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/sizes", sizeRoutes);
app.use("/api/colors", colorRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/cart", cartRoutes);

/* ========== Errores de celebrate (si usas celebrate en rutas) ==== */
app.use(celebrateErrors());

/* ====================== 404 controlado ========================== */
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

/* ===================== Error handler único ====================== */
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  const payload =
    status === 500
      ? { error: "Internal Server Error" }
      : { error: err.message || "Error" };
  if (status !== 404) console.error(`🔥 [${req.id}]`, err);
  res.status(status).json(payload);
});

/* ======= Endurecer Mongoose antes de conectar (ODM layer) ======= */
mongoose.set("sanitizeFilter", true);
mongoose.set("strictQuery", true);

/* ================== Conexión Mongo y arranque =================== */
mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 20_000,
  })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Backend en ${NODE_ENV} escuchando en :${PORT}`);
      console.log(`🌐 FRONTEND_ORIGIN = ${FRONTEND_ORIGIN}`);
      console.log(`🗄️  MongoDB = ${MONGO_URI}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error de conexión a MongoDB:", err);
    process.exit(1);
  });

/* =================== Seguimiento de conexiones vivas ============ */
const connections = new Set();
server.on("connection", (socket) => {
  connections.add(socket);
  socket.on("close", () => connections.delete(socket));
});

/* ======================== Cierre elegante ======================= */
function closeHttpServer(srv) {
  return new Promise((resolve) => srv.close(resolve));
}
async function gracefulShutdown(reason = "shutdown") {
  console.log(`\n🛑 Iniciando cierre elegante por: ${reason}`);

  const FORCE_EXIT_MS = 10_000;
  const forceTimer = setTimeout(() => {
    console.warn("⚠️ Forzando cierre por timeout de gracia");
    for (const socket of connections) {
      try {
        socket.destroy();
      } catch {}
    }
    process.exit(1);
  }, FORCE_EXIT_MS);
  forceTimer.unref();

  try {
    // 1) Cerrar Socket.IO
    try {
      const ioInstance = app.get("io");
      if (ioInstance && typeof ioInstance.close === "function")
        await ioInstance.close();
    } catch (e) {
      console.warn("⚠️ Error cerrando Socket.IO:", e?.message || e);
    }

    // 2) Dejar de aceptar nuevas conexiones HTTP y esperar a las actuales
    await closeHttpServer(server);

    // 3) Cerrar Mongoose
    try {
      await mongoose.disconnect();
    } catch (e) {
      console.warn("⚠️ Error cerrando Mongoose:", e?.message || e);
    }

    console.log("🧹 Conexiones cerradas limpiamente. Bye!");
    process.exit(0);
  } catch (err) {
    console.error("🔥 Error durante el cierre:", err);
    process.exit(1);
  }
}
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
  gracefulShutdown("unhandledRejection");
});
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  gracefulShutdown("uncaughtException");
});
