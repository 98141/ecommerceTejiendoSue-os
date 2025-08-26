import { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaTimesCircle, FaPlusCircle } from "react-icons/fa";

import axios from "axios";

import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";


const AdminListManager = ({ title, apiEndpoint, fieldName }) => {
  const { token } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [loading, setLoading] = useState(false);

  // Confirmación de borrado
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const singular = useMemo(() => {
    // fallback rápido: quita la última letra si termina en 's'
    return title?.endsWith("s") ? title.slice(0, -1) : title || "ítem";
  }, [title]);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authHeaders = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : {};

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiEndpoint, authHeaders);
      setItems(res.data || []);
    } catch {
      showToast("Error al cargar elementos", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const value = newValue.trim();
    if (!value) {
      showToast(`Ingresa un(a) ${singular.toLowerCase()}.`, "warning");
      return;
    }

    // Evitar duplicados (case-insensitive)
    const exists = items.some(
      (it) => String(it[fieldName] || "").toLowerCase() === value.toLowerCase()
    );
    if (exists) {
      showToast(`${singular} ya existe.`, "warning");
      return;
    }

    try {
      setLoading(true);
      await axios.post(apiEndpoint, { [fieldName]: value }, authHeaders);
      showToast(`${singular} creado con éxito`, "success");
      setNewValue("");
      fetchItems();
    } catch {
      showToast("Error al crear", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id) => {
    const value = editingValue.trim();
    if (!value) {
      showToast("El valor no puede estar vacío.", "warning");
      return;
    }

    // Evitar duplicados contra otros items
    const exists = items.some(
      (it) =>
        it._id !== id &&
        String(it[fieldName] || "").toLowerCase() === value.toLowerCase()
    );
    if (exists) {
      showToast(`${singular} ya existe.`, "warning");
      return;
    }

    try {
      setLoading(true);
      await axios.put(
        `${apiEndpoint}/${id}`,
        { [fieldName]: value },
        authHeaders
      );
      showToast(`${singular} actualizado`, "success");
      setEditingId(null);
      setEditingValue("");
      fetchItems();
    } catch {
      showToast("Error al actualizar", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${apiEndpoint}/${id}`, authHeaders);
      showToast(`${singular} eliminado`, "success");
      setConfirmDeleteId(null);
      fetchItems();
    } catch {
      showToast("Error al eliminar", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/products");
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditingValue(item[fieldName]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const onKeyDownEdit = (e, id) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEdit(id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  return (
    <div className="alm-container">
      <div className="alm-header">
        <h2>Administrar {title}</h2>
        {loading && <span className="alm-badge">Cargando…</span>}
      </div>

      <div className="alm-form-row">
        <input
          type="text"
          placeholder={`Nueva ${singular.toLowerCase()}`}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          disabled={loading}
        />
        <button
          className="btn btn--primary"
          onClick={handleCreate}
          disabled={loading}
          title={`Crear ${singular.toLowerCase()}`}
        >
          <FaPlusCircle style={{ marginRight: 6 }} />
          Agregar
        </button>
        <button
          className="btn btn--muted"
          onClick={handleCancel}
          title="Cancelar y volver"
          disabled={loading}
        >
          <FaTimesCircle style={{ marginRight: 6 }} />
          Cancelar
        </button>
      </div>

      <div className="alm-table-wrap">
        <table className="alm-table">
          <thead>
            <tr>
              <th>{singular}</th>
              <th className="col-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={2} className="empty-row">
                  No hay {title.toLowerCase()}.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id}>
                  <td>
                    {editingId === item._id ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => onKeyDownEdit(e, item._id)}
                        autoFocus
                      />
                    ) : (
                      <span className="alm-item-text">{item[fieldName]}</span>
                    )}
                  </td>
                  <td className="actions">
                    {editingId === item._id ? (
                      <>
                        <button
                          className="btn btn--primary btn-sm"
                          onClick={() => handleEdit(item._id)}
                          disabled={loading}
                          title="Guardar cambios"
                        >
                          Guardar
                        </button>
                        <button
                          className="btn btn--muted btn-sm"
                          onClick={cancelEdit}
                          disabled={loading}
                          title="Cancelar edición"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn--ghost btn-sm"
                          onClick={() => startEdit(item)}
                          disabled={loading}
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn--danger btn-sm"
                          onClick={() => setConfirmDeleteId(item._id)}
                          disabled={loading}
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmación de eliminación */}
      {confirmDeleteId && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Eliminar {singular.toLowerCase()}</h3>
            <p>¿Seguro que deseas eliminar este {singular.toLowerCase()}?</p>
            <div className="modal-actions">
              <button
                className="btn btn--muted"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancelar
              </button>
              <button
                className="btn btn--danger"
                onClick={() => handleDelete(confirmDeleteId)}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminListManager;
