import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import apiUrl from "../api/apiClient";

import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const AdminSupportInboxPage = () => {
  const [users, setUsers] = useState([]);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const res = await apiUrl.get("messages/inbox", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Error al cargar la bandeja de entrada", err);
      }
    };

    fetchInbox();
  }, [token]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Bandeja de soporte</h2>
      {users.length === 0 ? (
        <p>No hay mensajes de usuarios.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {users.map((user) => (
            <li
              key={user._id}
              onClick={() => navigate(`/support/${user._id}`)}
              style={{
                cursor: "pointer",
                padding: "10px",
                borderBottom: "1px solid #ccc",
              }}
            >
              {user.name} ({user.email})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminSupportInboxPage;
