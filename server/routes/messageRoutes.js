const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/auth");
const {
  getMessageHistory,
  sendMessage,
  getUnreadMessagesCount,
  markMessagesAsRead,
  getInboxUsers,
  getConversations,
} = require("../controllers/messageControler");

// Rutas específicas primero ✅
router.get("/unread/count", verifyToken, getUnreadMessagesCount);
router.post("/read", verifyToken, markMessagesAsRead);
router.get("/inbox/users", verifyToken, isAdmin, getInboxUsers);
router.get("/inbox/admin", verifyToken, isAdmin, getInboxUsers);
router.get("/conversations/list", verifyToken, getConversations);

// Enviar nuevo mensaje
router.post("/", verifyToken, sendMessage);

// Al final: historial entre dos usuarios
router.get("/:withUserId", verifyToken, getMessageHistory);

module.exports = router;
