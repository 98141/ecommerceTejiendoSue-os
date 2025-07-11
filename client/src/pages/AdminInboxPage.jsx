import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminInboxPage = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInbox = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          "http://localhost:5000/api/messages/inbox/admin",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUsers(res.data);
      } catch (err) {
        console.error("Error al cargar el inbox", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInbox(); // primera carga

      // 🔁 recarga automática cada 1 segundo
      const interval = setInterval(fetchInbox, 1000);

      // limpieza al desmontar
      return () => clearInterval(interval);
    }
  }, [token]);

  return (
    <div className="admin-inbox-container">
      <h2>📨 Conversaciones de Soporte</h2>

      {loading ? (
        <p className="empty-inbox">Cargando...</p>
      ) : users.length === 0 ? (
        <p className="empty-inbox">No hay mensajes aún.</p>
      ) : (
        <ul className="inbox-list">
          {users.map((u) => (
            <li key={u._id} className="inbox-item">
              <button
                className="inbox-button"
                onClick={() => navigate(`/support/${u._id}`)}
              >
                <div className="user-info">
                  <span className="user-name">{u.name}</span>
                  <span className="user-email">&lt;{u.email}&gt;</span>
                  <p className="last-message">
                    {u.lastMessage || "Sin mensajes aún."}
                    {u.unread && <span className="unread-dot"> ● Nuevo</span>}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminInboxPage;
