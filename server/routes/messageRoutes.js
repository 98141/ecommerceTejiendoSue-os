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
  updateConversationStatus,
} = require("../controllers/messageControler");

router.get("/unread/count", verifyToken, getUnreadMessagesCount);
router.post("/read", verifyToken, markMessagesAsRead);
router.get("/inbox/admin", verifyToken, isAdmin, getInboxUsers);
router.get("/conversations/list", verifyToken, getConversations);
router.post("/status", verifyToken, isAdmin, updateConversationStatus);

router.post("/", verifyToken, sendMessage);
router.get("/:withUserId", verifyToken, getMessageHistory);

module.exports = router;
