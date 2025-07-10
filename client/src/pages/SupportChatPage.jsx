import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SupportContext } from "../contexts/SupportContext";
import { AuthContext } from "../contexts/AuthContext";
import SupportChatBlock from "../blocks/SupportChatBlock";

const SupportChatPage = () => {
  const { user } = useContext(AuthContext);
  const { messages, fetchMessages, sendMessage } = useContext(SupportContext);
  const navigate = useNavigate();

  const ADMIN_ID = "admin"; // Placeholder – será reemplazado al cargar desde backend

  useEffect(() => {
    if (!user) return;
    // Si es usuario, escribe al admin; si es admin, espera que el withUserId llegue como query param o similar
    const withUserId = user.role === "user" ? "admin" : null;

    if (!withUserId) {
      navigate("/admin"); // o alguna otra página si no hay destinatario
      return;
    }

    fetchMessages(withUserId);
  }, [user]);

  const handleSend = (text) => {
    const to = user.role === "user" ? "admin" : null; // Aquí luego se podría seleccionar
    if (!to) return;
    sendMessage(to, text);
  };

  return (
    <div style={{ padding: "20px" }}>
      <SupportChatBlock
        messages={messages}
        onSendMessage={handleSend}
        user={user}
      />
    </div>
  );
};

export default SupportChatPage;
