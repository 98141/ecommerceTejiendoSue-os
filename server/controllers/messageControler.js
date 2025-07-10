const Message = require("../models/Message");
const User = require("../models/User");

// Obtener historial entre dos usuarios
exports.getMessageHistory = async (req, res) => {
  const { withUserId } = req.params;
  const userId = req.user.id;

  try {
    const messages = await Message.find({
      $or: [
        { from: userId, to: withUserId },
        { from: withUserId, to: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate("from", "name")
    .populate("to", "name");

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener mensajes" });
  }
};

// Enviar mensaje
exports.sendMessage = async (req, res) => {
  const { to, content } = req.body;

  try {
    const message = await Message.create({
      from: req.user.id,
      to,
      content
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: "Error al enviar el mensaje" });
  }
};

// Contar mensajes no leídos
exports.getUnreadMessagesCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      to: req.user.id,
      isRead: false
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Error al contar mensajes no leídos" });
  }
};

// Marcar como leídos
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { from } = req.body;
    await Message.updateMany(
      { from, to: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar mensajes" });
  }
};

// ✅ Obtener lista de usuarios con los que el admin ha conversado
exports.getInboxUsers = async (req, res) => {
  try {
    const adminId = req.user.id;

    const messages = await Message.find({
      $or: [{ from: adminId }, { to: adminId }],
    });

    const userIds = new Set();

    messages.forEach((msg) => {
      if (msg.from.toString() !== adminId) userIds.add(msg.from.toString());
      if (msg.to.toString() !== adminId) userIds.add(msg.to.toString());
    });

    const users = await User.find({ _id: { $in: [...userIds] } }).select("name email");

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener la bandeja de entrada" });
  }
};
