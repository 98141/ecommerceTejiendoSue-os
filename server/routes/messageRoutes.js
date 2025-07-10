const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/auth");
const {
  getMessageHistory,
  sendMessage,
  getUnreadMessagesCount,
  markMessagesAsRead,
  getInboxUsers
} = require("../controllers/messageControler");

// Obtener historial de conversación
router.get("/:withUserId", verifyToken, getMessageHistory);

// Enviar nuevo mensaje
router.post("/", verifyToken, sendMessage);

// Contar mensajes no leídos
router.get("/unread/count", verifyToken, getUnreadMessagesCount);

// Marcar mensajes como leídos
router.post("/read", verifyToken, markMessagesAsRead);

// Nueva ruta: obtener lista de usuarios con los que se ha chateado
router.get("/inbox/users", verifyToken, isAdmin, getInboxUsers);

module.exports = router;
