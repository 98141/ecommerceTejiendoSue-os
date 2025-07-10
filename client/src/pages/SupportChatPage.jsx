import { useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SupportContext } from "../contexts/SupportContext";
import { AuthContext } from "../contexts/AuthContext";
import SupportChatBlock from "../blocks/SupportChatBlock";

const SupportChatPage = () => {
  const { user } = useContext(AuthContext);
  const { messages, fetchMessages, sendMessage } = useContext(SupportContext);
  const navigate = useNavigate();
  const { withUserId } = useParams(); // ← permite que el admin chatee con un cliente

  useEffect(() => {
    if (!user) return;

    let targetId = "";

    if (user.role === "user") {
      targetId = "686c4d1c64583fa5d6a198dd"; // ← este ID debe coincidir con el que asignaste al administrador en la base de datos
    } else if (user.role === "admin") {
      if (!withUserId) {
        navigate("/admin/inbox"); // ← redirige si no tiene un destinatario
        return;
      }
      targetId = withUserId;
    }

    fetchMessages(targetId);
  }, [user, withUserId]);

const handleSend = (text) => {
  const to = user.role === "user" ? "686c4d1c64583fa5d6a198dd" : withUserId;
  if (!to) return;
  sendMessage(to, text);
};

  return (
    <div>
      <SupportChatBlock
        messages={messages}
        onSendMessage={handleSend}
        user={user}
      />
    </div>
  );
};

export default SupportChatPage;
