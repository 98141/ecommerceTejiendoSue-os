import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

const AdminListManager = ({ title, apiEndpoint, fieldName }) => {
  const { token } = useContext(AuthContext);
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(apiEndpoint);
      setItems(res.data);
    } catch {
      showToast("Error al cargar elementos", "error");
    }
  };

  const handleCreate = async () => {
    if (!newValue.trim()) return;

    try {
      await axios.post(
        apiEndpoint,
        { [fieldName]: newValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`${title.slice(0, -1)} creado con éxito`, "success");
      setNewValue("");
      fetchItems();
    } catch {
      showToast("Error al crear", "error");
    }
  };

  const handleEdit = async (id) => {
    try {
      await axios.put(
        `${apiEndpoint}/${id}`,
        { [fieldName]: editingValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`${title.slice(0, -1)} actualizado`, "success");
      setEditingId(null);
      fetchItems();
    } catch {
      showToast("Error al actualizar", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${apiEndpoint}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast(`${title.slice(0, -1)} eliminado`, "success");
      fetchItems();
    } catch {
      showToast("Error al eliminar", "error");
    }
  };

  return (
    <div className="admin-list-manager">
      <h2>Administrar {title}</h2>

      <div className="form-row">
        <input
          type="text"
          placeholder={`Nueva ${title.slice(0, -1).toLowerCase()}`}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
        />
        <button onClick={handleCreate}>Agregar</button>
      </div>

      <table className="admin-list-table">
        <thead>
          <tr>
            <th>{title.slice(0, -1)}</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>
                {editingId === item._id ? (
                  <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                  />
                ) : (
                  item[fieldName]
                )}
              </td>
              <td>
                {editingId === item._id ? (
                  <button onClick={() => handleEdit(item._id)}>Guardar</button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(item._id);
                      setEditingValue(item[fieldName]);
                    }}
                  >
                    Editar
                  </button>
                )}
                <button
                  className="delete"
                  onClick={() => handleDelete(item._id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminListManager;
