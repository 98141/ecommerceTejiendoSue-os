import { useState, useEffect, useRef } from "react";
import "./SupportChatBlock.css";

const SupportChatBlock = ({ messages, onSendMessage, user }) => {
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef();

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="chat-header">Soporte al cliente</div>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-message ${
              msg.from._id === user.id ? "sent" : "received"
            }`}
          >
            <span className="chat-sender">{msg.from.name}:</span>
            <p className="chat-text">{msg.content}</p>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Escribe tu mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Enviar</button>
      </div>
    </div>
  );
};

export default SupportChatBlock;
