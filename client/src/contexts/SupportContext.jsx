import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";
import { useToast } from "./ToastContext";
import { socket } from "../socket";

export const SupportContext = createContext();

export const SupportProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastUnreadToastShown, setLastUnreadToastShown] = useState(null);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

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
      await axios.post(
        `http://localhost:5000/api/messages`,
        { to, content: content.trim() },
        authHeaders
      );
      await fetchMessages(to);
      showToast("Mensaje enviado", "success");
    } catch (err) {
      console.error("Error al enviar mensaje", err);
      showToast("No se pudo enviar el mensaje", "error");
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

      const now = Date.now();
      if (
        res.data.count > 0 &&
        (!lastUnreadToastShown || now - lastUnreadToastShown > 30000)
      ) {
        showToast("Tienes nuevos mensajes sin leer", "info");
        setLastUnreadToastShown(now);
      }
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
      await fetchUnreadMessagesCount(); // sincroniza el contador
    } catch (err) {
      console.error("Error al marcar mensajes como leídos", err);
    }
  };

  useEffect(() => {
    if (token) {
      const interval = setInterval(fetchUnreadMessagesCount, 20000);
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    return () => setMessages([]);
  }, []);

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
