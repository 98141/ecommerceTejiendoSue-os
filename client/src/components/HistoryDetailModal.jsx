import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import { formatCOP } from "../utils/format";

const eventLabel = (kind) => {
  switch (kind) {
    case "CREATE": return "Creación";
    case "UPDATE_VARIANTS": return "Nuevas variantes";
    case "UPDATE_PRICE": return "Cambio de precio";
    case "UPDATE_INFO": return "Actualización";
    default: return kind || "—";
  }
};

export default function HistoryDetailModal({ id, open, onClose }) {
  const { token } = useContext(AuthContext);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !id) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/productsHistory/history/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setItem(response.data);
      } catch (err) {
        setError("Error al cargar los detalles del historial");
        console.error("Detalle de error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [open, id, token]);

  const getCategoryLabel = () => {
    if (!item) return "—";
    if (Array.isArray(item.categories)) {
      return item.categories
        .map((c) => c?.name || "")
        .filter(Boolean)
        .join(", ") || "—";
    }
    return item.categories?.name || (typeof item.categories === "string" ? item.categories : "—");
  };

  const handleRetry = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/productsHistory/history/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setItem(response.data);
    } catch (err) {
      setError("Error al cargar los detalles del historial");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="history-detail-modal"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        zIndex: 999
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111",
          color: "#fff",
          width: "min(900px, 100%)",
          borderRadius: 12,
          padding: "1rem 1rem 1.25rem"
        }}
      >
        <div
          className="modal-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #333",
            paddingBottom: ".5rem",
            marginBottom: "1rem"
          }}
        >
          <h3>Detalle de ingreso</h3>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar modal">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-indicator">
              <div className="loading-spinner"></div>
              <p>Cargando detalles...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button className="retry-btn" onClick={handleRetry}>
                Reintentar
              </button>
            </div>
          ) : item ? (
            <>
              <div
                className="grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: ".5rem .75rem"
                }}
              >
                <div className="grid-item">
                  <strong>Fecha</strong>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>

                <div className="grid-item">
                  <strong>Evento</strong>
                  <span>{eventLabel(item.kind)}</span>
                </div>

                <div className="grid-item">
                  <strong>Nombre</strong>
                  <span>{item.name || "—"}</span>
                </div>

                <div className="grid-item">
                  <strong>Precio</strong>
                  <span>{formatCOP(item.price)}</span>
                </div>

                <div className="grid-item">
                  <strong>Categoría</strong>
                  <span>{getCategoryLabel()}</span>
                </div>

                {item.note && (
                  <div className="grid-item" style={{ gridColumn: "1 / -1" }}>
                    <strong>Nota</strong>
                    <span>{item.note}</span>
                  </div>
                )}
              </div>

              <div className="variants-section" style={{ marginTop: "1rem" }}>
                <h4>Variantes</h4>
                <table className="variants-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th>Talla</th>
                      <th>Color</th>
                      <th>Stock inicial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.variants && item.variants.length > 0 ? (
                      item.variants.map((v, idx) => (
                        <tr key={idx}>
                          <td>{v.size?.label || "—"}</td>
                          <td>{v.color?.name || "—"}</td>
                          <td>{v.initialStock ?? 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="no-variants-message">
                          No hay variantes registradas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
