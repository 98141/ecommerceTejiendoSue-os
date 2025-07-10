import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";
import { useToast } from "./ToastContext";

// eslint-disable-next-line react-refresh/only-export-components
export const SupportContext = createContext();

export const SupportProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchMessages = async (withUserId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/messages/${withUserId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(res.data);
    } catch (err) {
      console.error("Error al cargar mensajes", err);
    }
  };

  const sendMessage = async (to, content) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/messages`,
        { to, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("Error al enviar mensaje", err);
    }
  };

  const fetchUnreadMessagesCount = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/messages/unread-count",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUnreadCount(res.data.count);

      if (res.data.count > 0) {
        showToast("Tienes nuevos mensajes sin leer", "info");
      }
    } catch (err) {
      console.error("Error al obtener conteo de mensajes no leídos", err);
    }
  };

  // Verifica cada 20 segundos si hay mensajes nuevos
  useEffect(() => {
    if (token) {
      const interval = setInterval(fetchUnreadMessagesCount, 20000); // 20 segundos
      return () => clearInterval(interval);
    }
  }, [token]);

  return (
    <SupportContext.Provider
      value={{
        messages,
        fetchMessages,
        sendMessage,
        unreadCount,
        fetchUnreadMessagesCount,
      }}
    >
      {children}
    </SupportContext.Provider>
  );
};
