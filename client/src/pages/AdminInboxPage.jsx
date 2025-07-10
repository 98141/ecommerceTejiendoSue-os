import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminInboxPage = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/messages/inbox/admin", {
          headers: { Authorization: `Bearer ${token} ` },
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Error al cargar el inbox", err);
      }
    };

    fetchInbox();
  }, [token]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Inbox de Soporte </h2>
      {users.length === 0 ? (
        <p>No hay mensajes aún.</p>
      ) : (
        <ul>
          {users.map((u) => (
            <li key={u._id}>
              <button
                className="btn-link"
                onClick={() => navigate(`/support/${u._id}`)}
              >
                {u.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminInboxPage;

