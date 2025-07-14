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
const ensureUploadsFolderExists = require("./utils/products");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Cliente conectado:", socket.id);
  socket.on("sendMessage", (message) => {
    io.emit("newMessage", message);
  });
  socket.on("disconnect", () => {
    console.log("❌ Cliente desconectado:", socket.id);
  });
});

app.use(cors());
app.use(express.json());
app.set("io", io);

// Servir archivos estáticos correctamente
ensureUploadsFolderExists();
app.use("/uploads/products", express.static("uploads/products"));

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/messages", messageRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(process.env.PORT, () => {
      console.log(`🚀 Servidor backend en http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => console.error("❌ Error de conexión a MongoDB:", err));
