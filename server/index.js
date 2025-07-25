require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const messageRoutes = require("./routes/messageRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const sizeRoutes = require("./routes/sizeRoutes");
const colorRoutes = require("./routes/colorRoutes");
const visitRoutes = require("./routes/visitRouter");
const dashboardRoutes = require("./routes/dashboardRoutes");

const ensureUploadsFolderExists = require("./utils/products");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("sendMessage", (message) => {
    io.emit("newMessage", message);
  });
  socket.on("disconnect", () => {});
});

const corsOptions = {
  origin: "http://localhost:5173", // 👈 origen frontend exacto
  credentials: true, // 👈 permite envío de cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // opcional
  allowedHeaders: ["Content-Type", "Authorization"], // opcional
};

app.use(cors(corsOptions));
app.use(express.json());
app.set("io", io);

// Servir archivos estáticos correctamente
ensureUploadsFolderExists();
app.use("/uploads/products", express.static("uploads/products"));

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/sizes", sizeRoutes);
app.use("/api/colors", colorRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/dashboard", dashboardRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(process.env.PORT, () => {
      console.log(
        `🚀 Servidor backend en http://localhost:${process.env.PORT}`
      );
    });
  })
  .catch((err) => console.error("❌ Error de conexión a MongoDB:", err));
