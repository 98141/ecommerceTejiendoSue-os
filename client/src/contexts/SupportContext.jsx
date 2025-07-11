// SupportContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";
import { useToast } from "./ToastContext";
import { socket } from "../socket"; // nuevo

export const SupportContext = createContext();

export const SupportProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // 🔌 Conectar al socket una vez autenticado
  useEffect(() => {
    if (token && user) {
      socket.auth = { token };
      socket.connect();

      socket.on("connect", () => {
        console.log("🔌 Conectado al socket:", socket.id);
      });

      socket.on("newMessage", (msg) => {
        setMessages((prev) => [...prev, msg]);
        showToast("Nuevo mensaje recibido", "info");
        fetchUnreadMessagesCount(); // actualiza contador
      });

      return () => {
        socket.off("newMessage");
        socket.disconnect();
      };
    }
  }, [token, user]);

  const fetchMessages = async (withUserId) => {
    if (!token || !withUserId) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/messages/${withUserId}`,
        authHeaders
      );
      setMessages(res.data);
    } catch (err) {
      console.error("Error al cargar mensajes", err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (to, content) => {
    if (!token || !to || !content.trim()) return;
    try {
      const res = await axios.post(
        `http://localhost:5000/api/messages`,
        { to, content: content.trim() },
        authHeaders
      );
      socket.emit("sendMessage", res.data); // envía mensaje por socket
      await fetchMessages(to);
    } catch (err) {
      console.error("Error al enviar mensaje", err);
    }
  };

  const fetchUnreadMessagesCount = async () => {
    if (!token) return;
    try {
      const res = await axios.get(
        "http://localhost:5000/api/messages/unread/count",
        authHeaders
      );
      setUnreadCount(res.data.count);
    } catch (err) {
      console.error("Error al obtener conteo de mensajes no leídos", err);
    }
  };

  const markMessagesAsRead = async (fromUserId) => {
    if (!token || !fromUserId) return;
    try {
      await axios.post(
        "http://localhost:5000/api/messages/read",
        { from: fromUserId },
        authHeaders
      );
      await fetchUnreadMessagesCount(); // actualiza global
    } catch (err) {
      console.error("Error al marcar mensajes como leídos", err);
    }
  };

  return (
    <SupportContext.Provider
      value={{
        messages,
        fetchMessages,
        sendMessage,
        unreadCount,
        fetchUnreadMessagesCount,
        markMessagesAsRead,
        loading,
      }}
    >
      {children}
    </SupportContext.Provider>
  );
};
