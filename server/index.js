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
const { Server } = require("socket.io");

const app = express();

const PORT = Number(process.env.PORT || 5000);

// Preferimos FRONTEND_ORIGIN; si no existe, usamos CLIENT_URL; fallback localhost
const FRONTEND_ORIGIN = (
  process.env.FRONTEND_ORIGIN ||
  process.env.CLIENT_URL ||
  "http://localhost:5173"
).replace(/\/+$/, "");

/* ======================= Funciones utilitarias =================== */
// Asegura /uploads/products para servir imágenes
function ensureUploadsFolderExists() {
  try {
    const uploadsRoot = path.join(__dirname, "uploads");
    const productsDir = path.join(uploadsRoot, "products");

    if (!fs.existsSync(uploadsRoot)) {
      fs.mkdirSync(uploadsRoot, { recursive: true });
    }
    if (!fs.existsSync(productsDir)) {
      fs.mkdirSync(productsDir, { recursive: true });
    }
    const keep = path.join(productsDir, ".gitkeep");
    if (!fs.existsSync(keep)) {
      fs.writeFileSync(keep, "");
    }
    console.log("📁 Directorios de uploads asegurados:", productsDir);
  } catch (err) {
    console.error("❌ No se pudo asegurar la carpeta de uploads:", err);
  }
}

/* =========================== Middlewares ========================= */
app.use(
  helmet({
    // Activa CSP cuando elimines inline styles/scripts en el frontend
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());

app.use(
  express.json({
    limit: "2mb",
    strict: true,
  })
);
app.use(cookieParser());

/* ============================= CORS ============================== */
const corsOptions = {
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Req-Id"],
  exposedHeaders: ["X-Req-Id"],
  maxAge: 86400, // preflight cache (1 día)
};
app.use(cors(corsOptions));

/* ====================== HTTP server + Socket.IO ================== */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Eventos básicos de chat (ajusta a tus necesidades)
io.on("connection", (socket) => {
  socket.on("sendMessage", (message) => {
    io.emit("newMessage", message);
  });
  socket.on("disconnect", () => {});
});

// Exponer io para uso en controladores
app.set("io", io);

/* ============================ Timeouts =========================== */
// Endurecimiento de tiempos a nivel servidor (DoS ligeras / colgados)
server.headersTimeout = 65000;   
server.requestTimeout = 30000;   
server.keepAliveTimeout = 60000; 

// Timeouts granulares por request/response
app.use((req, res, next) => {
  req.setTimeout(15000);  
  res.setTimeout(20000);  
  next();
});

/* ======================== Archivos estáticos ===================== */
ensureUploadsFolderExists();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads/products", express.static(path.join(__dirname, "uploads/products")));

/* ============================== Rutas ============================ */
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

// Healthcheck simple
app.get("/health", (req, res) => res.json({ ok: true, ts: Date.now() }));

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

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pajatoquilla";

mongoose
  .connect(MONGO_URI, {
    // opciones defensivas
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 20000,
    dbName: undefined,
  })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Backend escuchando en http://localhost:${PORT}`);
      console.log(`🌐 FRONTEND_ORIGIN = ${FRONTEND_ORIGIN}`);
      console.log(`🗄️  MongoDB = ${MONGO_URI}`);
      console.log(`🔐 NODE_ENV = ${process.env.NODE_ENV || "development"}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error de conexión a MongoDB:", err);
    process.exit(1);
  });

/* =========================== Manejo básico de errores ============ */
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler explícito (evita filtrar stack en prod)
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled error:", err);
  const status = err.status || 500;
  const payload = {
    error: status === 500 ? "Internal Server Error" : err.message || "Error",
  };
  res.status(status).json(payload);
});
