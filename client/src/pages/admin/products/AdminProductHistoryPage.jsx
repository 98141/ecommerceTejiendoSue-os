import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";

const ProductHistoryPage = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/products/${id}/history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setHistory(res.data);
    } catch (err) {
      showToast("Error al obtener historial del producto", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="history-container">
      <h2>Historial de cambios</h2>
      <button className="btn-back" onClick={() => navigate("/admin/products")}>
        ← Volver
      </button>

      {loading ? (
        <p>Cargando historial...</p>
      ) : history.length === 0 ? (
        <p>No hay cambios registrados para este producto.</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Campo modificado</th>
              <th>Valor anterior</th>
              <th>Valor nuevo</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record, index) => (
              <tr key={index}>
                <td>{new Date(record.date).toLocaleString()}</td>
                <td>{record.field}</td>
                <td>{String(record.oldValue)}</td>
                <td>{String(record.newValue)}</td>
                <td>{record.modifiedBy?.name || "Admin"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProductHistoryPage;
