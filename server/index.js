require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require("http"); // necesario para socket.io
const { Server } = require("socket.io");

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();
const server = http.createServer(app); // socket necesita servidor http

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // frontend
    methods: ["GET", "POST"]
  }
});

// 🔌 WebSocket conectado
io.on("connection", (socket) => {
  console.log("🔌 Cliente conectado:", socket.id);

  // ✅ Paso 1: recibir mensaje emitido por el frontend
  socket.on("sendMessage", (message) => {
    console.log("📨 Mensaje recibido vía socket:", message);
    // reenviar a todos los clientes conectados (broadcast)
    io.emit("newMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("❌ Cliente desconectado:", socket.id);
  });
});

// Middlewares
app.use(cors());
app.use(express.json());
app.set("io", io); // para usarlo en controladores

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);

// DB + arranque del servidor
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(process.env.PORT, () => {
      console.log(`🚀 Servidor backend en http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => console.error('❌ Error de conexión a MongoDB:', err));
