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
        { from: withUserId, to: userId },
      ],
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
  try {
    const { to, content } = req.body;
    const from = req.user.id;

    const message = await Message.create({ from, to, content });

    const populatedMessage = await message.populate("from to", "name email");

    // Enviar mensaje en tiempo real usando Socket.IO
    const io = req.app.get("io");
    io.emit("newMessage", populatedMessage); // Puedes filtrar esto por usuario más adelante

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error("Error al enviar mensaje", err);
    res.status(500).json({ error: "Error al enviar mensaje" });
  }
};

// Contar mensajes no leídos
exports.getUnreadMessagesCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      to: req.user.id,
      isRead: false,
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

    // Obtener todos los mensajes que involucren al admin (enviados o recibidos)
    const messages = await Message.find({
      $or: [{ from: adminId }, { to: adminId }],
    })
      .sort({ createdAt: -1 })
      .populate("from to", "name email");

    const userMap = {};

    for (let msg of messages) {
      // Identificar con quién fue la conversación (usuario, no admin)
      const other = msg.from._id.toString() === adminId ? msg.to : msg.from;
      const otherId = other._id.toString();

      // Si el usuario no está en el mapa, lo agregamos
      if (!userMap[otherId]) {
        // Buscar si hay al menos un mensaje sin leer de este usuario al admin
        const hasUnread = await Message.exists({
          from: otherId,
          to: adminId,
          isRead: false,
        });

        userMap[otherId] = {
          _id: other._id,
          name: other.name,
          email: other.email,
          lastMessage: msg.content,
          unread: !!hasUnread,
        };
      }
    }

    res.json(Object.values(userMap));
  } catch (err) {
    console.error("Error en getInboxUsers:", err);
    res.status(500).json({ error: "Error al obtener inbox de admin" });
  }
};

// Obtener lista de usuarios con los que el admin ha hablado
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [{ from: userId }, { to: userId }],
    })
      .populate("from", "name role")
      .populate("to", "name role");

    // Extraer IDs únicos de usuarios con los que se ha hablado
    const usersMap = {};

    messages.forEach((msg) => {
      const otherUser = msg.from._id.equals(userId) ? msg.to : msg.from;
      if (!usersMap[otherUser._id]) {
        usersMap[otherUser._id] = {
          id: otherUser._id,
          name: otherUser.name,
          role: otherUser.role,
        };
      }
    });

    // Obtener usuarios únicos con los que el admin ha hablado
    exports.getInboxUsers = async (req, res) => {
      try {
        const adminId = req.user.id;
        const messages = await Message.find({
          $or: [{ from: adminId }, { to: adminId }],
        }).populate("from to", "name");

        // Extraer usuarios únicos con los que el admin ha hablado
        const userMap = {};

        messages.forEach((msg) => {
          const user = msg.from._id.toString() === adminId ? msg.to : msg.from;

          userMap[user._id] = user;
        });

        const users = Object.values(userMap);
        res.json(users);
      } catch (err) {
        res.status(500).json({ error: "Error al cargar inbox" });
      }
    };

    res.json(Object.values(usersMap));
  } catch (err) {
    res.status(500).json({ error: "Error al obtener conversaciones" });
  }
};
